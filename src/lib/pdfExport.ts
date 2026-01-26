import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo-pdf-export.png';


interface Product {
  id: string;
  name: string;
  product_number: string | null;
  description: string | null;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  is_active: boolean;
  discount_percentage: number | null;
  tax_rate: number;
}

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

interface Vehicle {
  id: string;
  vehicle_number: string | null;
  brand: string;
  model: string;
  vehicle_type: string | null;
  first_registration_date: string;
  mileage: number;
  price: number;
  fuel_type: string;
  transmission: string;
  power_hp: number | null;
  color: string | null;
  is_sold: boolean | null;
  is_reserved: boolean | null;
  discount_percentage: number | null;
  vat_deductible: boolean | null;
}

const COLORS = {
  navy: [26, 35, 51] as [number, number, number],
  gold: [189, 164, 110] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  textDark: [51, 51, 51] as [number, number, number],
  textMuted: [102, 102, 102] as [number, number, number],
};

const IMPRESSUM = {
  company: 'Kley Rechtsanwalt GmbH',
  address: 'Eiderkamp 13, 24582 Bordesholm',
  registry: 'Amtsgericht Kiel, HRB 25081 KI',
  vatId: 'USt-IdNr.: DE162233216',
  email: 'info@kanzlei-kley.com',
  phone: '+49 4322 6874699',
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
};

// Map singular vehicle types to plural for display
const getVehicleTypePlural = (type: string): string => {
  const pluralMap: Record<string, string> = {
    'Fahrzeug': 'Fahrzeuge',
    'Motorrad': 'Motorräder',
    'Baumaschine': 'Baumaschinen',
  };
  return pluralMap[type] || type;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = imagePath;
  });
};

const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  
  // Light separator line
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20);
  
  // Impressum text
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  
  const impressumText = `${IMPRESSUM.company} | ${IMPRESSUM.address} | ${IMPRESSUM.vatId}`;
  doc.text(impressumText, 15, pageHeight - 12);
  
  // Page number on the right
  doc.text(`Seite ${pageNumber} von ${totalPages}`, pageWidth - 15, pageHeight - 12, { align: 'right' });
};

const addHeader = async (doc: jsPDF, logoBase64: string) => {
  addHeaderSync(doc, logoBase64);
};

const addHeaderSync = (doc: jsPDF, logoBase64: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Add logo on the left
  try {
    const logoWidth = 36;
    const logoHeight = 13;
    doc.addImage(logoBase64, 'PNG', 15, 12, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to header:', error);
  }
  
  // Title next to logo
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Bestandsliste', 55, 20);
  
  // Company info on the right
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDark);
  doc.setFont('helvetica', 'bold');
  doc.text(IMPRESSUM.company, pageWidth - 15, 12, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(IMPRESSUM.address, pageWidth - 15, 17, { align: 'right' });
  doc.text(`E-Mail: ${IMPRESSUM.email}`, pageWidth - 15, 21, { align: 'right' });
  doc.text(`T: ${IMPRESSUM.phone}`, pageWidth - 15, 25, { align: 'right' });
  
  // Separator line below header
  doc.setDrawColor(...COLORS.textMuted);
  doc.setLineWidth(0.3);
  doc.line(15, 32, pageWidth - 15, 32);
};

const createCoverPage = async (doc: jsPDF, logoBase64: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // White background (default)
  
  // Add logo (centered, larger)
  try {
    const logoWidth = 80;
    const logoHeight = 30;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 60, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to cover:', error);
  }
  
  // Title
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Bestandsliste', pageWidth / 2, 120, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text('Übersicht aller Produkte & Fahrzeuge', pageWidth / 2, 135, { align: 'center' });
  
  // Gold decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(60, 150, pageWidth - 60, 150);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textDark);
  doc.text(`Stand: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 170, { align: 'center' });
  
  // Company info at bottom
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text(IMPRESSUM.company, pageWidth / 2, pageHeight - 60, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  doc.text(IMPRESSUM.address, pageWidth / 2, pageHeight - 52, { align: 'center' });
  doc.text(`T: ${IMPRESSUM.phone} | E-Mail: ${IMPRESSUM.email}`, pageWidth / 2, pageHeight - 44, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`${IMPRESSUM.registry} | ${IMPRESSUM.vatId}`, pageWidth / 2, pageHeight - 36, { align: 'center' });
};

const addSectionTitle = (doc: jsPDF, title: string, yPosition: number) => {
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, yPosition);
  
  return yPosition + 8;
};

export const exportCatalogToPDF = async (): Promise<void> => {
  // Fetch all data
  const [productsResult, categoriesResult, vehiclesResult] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('name'),
    supabase.from('categories').select('*').order('sort_order'),
    supabase.from('cars_for_sale').select('*').is('deleted_at', null).order('brand'),
  ]);

  const products: Product[] = productsResult.data || [];
  const categories: Category[] = categoriesResult.data || [];
  const vehicles: Vehicle[] = vehiclesResult.data || [];

  // Create category map
  const categoryMap = new Map<string, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  // Find parent categories (categories without parent_id)
  const parentCategories = categories.filter(cat => !cat.parent_id);

  // Group products by PARENT category (not subcategory)
  const productsByParentCategory = new Map<string, { category: Category | null; products: Product[] }>();
  
  products.forEach(product => {
    let parentCategoryId = 'uncategorized';
    let parentCategory: Category | null = null;
    
    if (product.category_id) {
      const productCategory = categoryMap.get(product.category_id);
      if (productCategory) {
        // If this category has a parent, use the parent
        if (productCategory.parent_id) {
          parentCategoryId = productCategory.parent_id;
          parentCategory = categoryMap.get(productCategory.parent_id) || null;
        } else {
          // This is already a parent category
          parentCategoryId = productCategory.id;
          parentCategory = productCategory;
        }
      }
    }
    
    if (!productsByParentCategory.has(parentCategoryId)) {
      productsByParentCategory.set(parentCategoryId, { category: parentCategory, products: [] });
    }
    productsByParentCategory.get(parentCategoryId)!.products.push(product);
  });

  // Load logo
  let logoBase64 = '';
  try {
    logoBase64 = await loadImageAsBase64(logoImage);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Create PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Cover page
  await createCoverPage(doc, logoBase64);
  
  let currentPage = 1;
  const pages: (() => void)[] = [];

  // Products section
  doc.addPage();
  currentPage++;
  await addHeader(doc, logoBase64);
  
  let yPos = 40;
  
  // Section title for products
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Produkte', 15, yPos);
  yPos += 10;

  // Products by parent category
  for (const [categoryId, { category, products: categoryProducts }] of productsByParentCategory) {
    if (categoryProducts.length === 0) continue;
    
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      currentPage++;
      await addHeader(doc, logoBase64);
      yPos = 45;
    }
    
    // Category title (only parent category name)
    const categoryName = category?.name || 'Ohne Kategorie';
    
    yPos = addSectionTitle(doc, categoryName, yPos);
    
    // Products table
    const tableData = categoryProducts.map(product => {
      const nettoPrice = product.discount_percentage && product.discount_percentage > 0
        ? product.price * (1 - product.discount_percentage / 100)
        : product.price;
      const bruttoPrice = nettoPrice * 1.19; // Add 19% VAT
      
      return [
        product.product_number || '-',
        product.name,
        formatCurrency(nettoPrice),
        formatCurrency(bruttoPrice),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Position / Art.-Nr.', 'Beschreibung', 'Nettopreis', 'Endpreis']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.gold,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.textDark,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 85 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
      },
      margin: { top: 40, bottom: 25, left: 15, right: 15 },
      didDrawPage: (data: any) => {
        // Add header on new pages created by autoTable
        if (data.pageNumber > 1 || doc.getNumberOfPages() > currentPage) {
          addHeaderSync(doc, logoBase64);
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Vehicles section - new page
  if (vehicles.length > 0) {
    doc.addPage();
    currentPage++;
    await addHeader(doc, logoBase64);
    
    yPos = 40;
    
    // Section title for vehicles
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Fahrzeuge', 15, yPos);
    yPos += 10;

    // Group vehicles by type
    const vehiclesByType = new Map<string, Vehicle[]>();
    vehicles.forEach(vehicle => {
      const type = vehicle.vehicle_type || 'Fahrzeug';
      if (!vehiclesByType.has(type)) {
        vehiclesByType.set(type, []);
      }
      vehiclesByType.get(type)!.push(vehicle);
    });

    for (const [vehicleType, typeVehicles] of vehiclesByType) {
      if (typeVehicles.length === 0) continue;
      
      // Check if we need a new page
      if (yPos > 240) {
        doc.addPage();
        currentPage++;
        await addHeader(doc, logoBase64);
        yPos = 45;
      }
      
      yPos = addSectionTitle(doc, getVehicleTypePlural(vehicleType), yPos);
      
      const tableData = typeVehicles.map(vehicle => {
        const finalPrice = vehicle.discount_percentage && vehicle.discount_percentage > 0
          ? vehicle.price * (1 - vehicle.discount_percentage / 100)
          : vehicle.price;
        
        const vatStatus = vehicle.vat_deductible ? 'Ja' : 'Nein';
        
        return [
          vehicle.vehicle_number || '-',
          `${vehicle.brand} ${vehicle.model}`,
          formatDate(vehicle.first_registration_date),
          `${vehicle.mileage.toLocaleString('de-DE')} km`,
          `${vehicle.power_hp || '-'} PS`,
          vatStatus,
          formatCurrency(finalPrice),
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Fzg.-Nr.', 'Bezeichnung', 'EZ', 'Km-Stand', 'Leistung', 'MwSt.\nausweisbar', 'Preis (netto)']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.gold,
          textColor: COLORS.white,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
          textColor: COLORS.textDark,
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 42 },
          2: { cellWidth: 20 },
          3: { cellWidth: 24 },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 24, halign: 'center' },
          6: { cellWidth: 34, halign: 'right' },
        },
        margin: { top: 40, bottom: 25, left: 15, right: 15 },
        didDrawPage: (data: any) => {
          // Add header on new pages created by autoTable
          if (data.pageNumber > 1 || doc.getNumberOfPages() > currentPage) {
            addHeaderSync(doc, logoBase64);
          }
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }
  }

  // Add footers to all pages (except cover)
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(doc, i - 1, totalPages - 1);
  }

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Katalog_${dateStr}.pdf`);
};
