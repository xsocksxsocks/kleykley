import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedProduct {
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  imageDescription: string | null;
}

interface ExtractedData {
  products: ExtractedProduct[];
  images: {
    productName: string;
    base64: string;
  }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, pageNumbers } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ success: false, error: 'PDF data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting PDF product extraction...');

const systemPrompt = `Du bist ein Experte für die Extraktion von Produktdaten aus PDF-Dokumenten wie Katalogen und Preislisten.

Deine Aufgabe ist es, alle Produkte aus dem bereitgestellten PDF zu extrahieren und strukturiert zurückzugeben.

Für jedes Produkt extrahiere:
- name: Der vollständige Produktname
- description: Eine Beschreibung des Produkts (kann null sein)
- price: Der Preis als Zahl ohne Währungssymbol (z.B. 49.99). Wenn kein Preis angegeben ist, setze null
- category: Eine passende Kategorie für das Produkt basierend auf dem Kontext (kann null sein)
- imageDescription: Eine kurze Beschreibung des Produktbildes falls vorhanden (z.B. "Schwarzes T-Shirt mit Logo", "Metallisches Gehäuse"). Falls kein Bild vorhanden, setze null.

Achte besonders auf:
- Artikelnummern und Produktbezeichnungen
- Preisangaben (brutto/netto, Stückpreis, Staffelpreise - nimm den Einzelpreis)
- Kategorien oder Abschnittsüberschriften
- Technische Spezifikationen als Teil der Beschreibung
- Produktbilder und deren visuelle Eigenschaften

Gib die Produkte als JSON-Array zurück.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: pageNumbers 
                  ? `Extrahiere alle Produkte von den Seiten ${pageNumbers} aus diesem PDF-Dokument.`
                  : 'Extrahiere alle Produkte aus diesem PDF-Dokument.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: pdfBase64.startsWith('data:') ? pdfBase64 : `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_products',
              description: 'Extrahiert Produkte aus einem PDF-Dokument',
              parameters: {
                type: 'object',
                properties: {
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Produktname' },
                        description: { type: 'string', nullable: true, description: 'Produktbeschreibung' },
                        price: { type: 'number', nullable: true, description: 'Preis als Zahl' },
                        category: { type: 'string', nullable: true, description: 'Produktkategorie' },
                        imageDescription: { type: 'string', nullable: true, description: 'Beschreibung des Produktbildes' }
                      },
                      required: ['name']
                    }
                  }
                },
                required: ['products']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_products' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit erreicht. Bitte versuche es später erneut.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI Credits aufgebraucht. Bitte lade dein Guthaben auf.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Fehler bei der KI-Extraktion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    console.log('AI Response received');

    // Extract products from tool call response
    let products: ExtractedProduct[] = [];
    
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        products = args.products || [];
      } catch (parseError) {
        console.error('Error parsing tool call arguments:', parseError);
      }
    }

    // Fallback: try to parse from content if no tool call
    if (products.length === 0 && aiResponse.choices?.[0]?.message?.content) {
      const content = aiResponse.choices[0].message.content;
      try {
        // Try to find JSON array in the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          products = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Error parsing content as JSON:', parseError);
      }
    }

    console.log(`Extracted ${products.length} products`);

    // Generate images for products that have image descriptions
    const productsWithImages: ExtractedProduct[] = [];
    const productImages: { productName: string; base64: string }[] = [];

    for (const product of products) {
      productsWithImages.push(product);
      
      if (product.imageDescription) {
        try {
          console.log(`Generating image for: ${product.name}`);
          
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: `Generate a professional product photo of: ${product.imageDescription}. Clean white background, high quality, commercial product photography style.`
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            if (generatedImage) {
              productImages.push({
                productName: product.name,
                base64: generatedImage
              });
              console.log(`Image generated for: ${product.name}`);
            }
          }
        } catch (imageError) {
          console.error(`Error generating image for ${product.name}:`, imageError);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        products: productsWithImages,
        images: productImages,
        count: productsWithImages.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
