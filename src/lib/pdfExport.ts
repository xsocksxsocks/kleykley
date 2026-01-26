import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo-pdf-export.png';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

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
  email: 'info@kanzlei-kley.com',
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
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
  
  // Footer background
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, pageHeight - 25, pageWidth, 25, 'F');
  
  // Gold line above footer
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
  
  // Impressum text
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'normal');
  
  const impressumText = `${IMPRESSUM.company} | ${IMPRESSUM.address} | ${IMPRESSUM.registry} | ${IMPRESSUM.email}`;
  doc.text(impressumText, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Page number
  doc.setFontSize(8);
  doc.text(`Seite ${pageNumber} von ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
};

const addHeader = async (doc: jsPDF, logoBase64: string) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  // Add logo (proportionally scaled)
  try {
    const logoWidth = 35;
    const logoHeight = 12;
    doc.addImage(logoBase64, 'PNG', 15, 9, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to header:', error);
  }
  
  // Date on the right
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text(`Stand: ${formatDate(new Date().toISOString())}`, pageWidth - 15, 18, { align: 'right' });
  
  // Gold line below header
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(0, 30, pageWidth, 30);
};

const createCoverPage = async (doc: jsPDF, logoBase64: string) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Full navy background
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Gold decorative lines
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(2);
  doc.line(30, 60, pageWidth - 30, 60);
  doc.line(30, pageHeight - 80, pageWidth - 30, pageHeight - 80);
  
  // Add logo (centered, larger)
  try {
    const logoWidth = 80;
    const logoHeight = 28;
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, 100, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error adding logo to cover:', error);
  }
  
  // Title
  doc.setFontSize(32);
  doc.setTextColor(...COLORS.gold);
  doc.setFont('helvetica', 'bold');
  doc.text('Produktkatalog', pageWidth / 2, 180, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'normal');
  doc.text('Übersicht aller Produkte & Fahrzeuge', pageWidth / 2, 200, { align: 'center' });
  
  // Date
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.gold);
  doc.text(formatDate(new Date().toISOString()), pageWidth / 2, 230, { align: 'center' });
  
  // Impressum at bottom
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.white);
  doc.text(IMPRESSUM.company, pageWidth / 2, pageHeight - 55, { align: 'center' });
  doc.text(IMPRESSUM.address, pageWidth / 2, pageHeight - 45, { align: 'center' });
  doc.text(`${IMPRESSUM.registry}`, pageWidth / 2, pageHeight - 35, { align: 'center' });
};

const addSectionTitle = (doc: jsPDF, title: string, yPosition: number) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Background bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(15, yPosition - 5, pageWidth - 30, 12, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPosition + 3);
  
  return yPosition + 15;
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

  // Group products by category
  const productsByCategory = new Map<string, { category: Category | null; products: Product[] }>();
  
  products.forEach(product => {
    const categoryId = product.category_id || 'uncategorized';
    const category = product.category_id ? categoryMap.get(product.category_id) || null : null;
    
    if (!productsByCategory.has(categoryId)) {
      productsByCategory.set(categoryId, { category, products: [] });
    }
    productsByCategory.get(categoryId)!.products.push(product);
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
  
  let yPos = 45;
  
  // Section title for products
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.text('Produkte', 15, yPos);
  yPos += 15;

  // Products by category
  for (const [categoryId, { category, products: categoryProducts }] of productsByCategory) {
    if (categoryProducts.length === 0) continue;
    
    // Check if we need a new page
    if (yPos > 240) {
      doc.addPage();
      currentPage++;
      await addHeader(doc, logoBase64);
      yPos = 45;
    }
    
    // Category title
    const categoryName = category?.name || 'Ohne Kategorie';
    let parentName = '';
    if (category?.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) parentName = `${parent.name} › `;
    }
    
    yPos = addSectionTitle(doc, `${parentName}${categoryName}`, yPos);
    
    // Products table
    const tableData = categoryProducts.map(product => {
      const finalPrice = product.discount_percentage && product.discount_percentage > 0
        ? product.price * (1 - product.discount_percentage / 100)
        : product.price;
      
      return [
        product.product_number || '-',
        product.name,
        product.stock_quantity.toString(),
        product.discount_percentage && product.discount_percentage > 0 
          ? `${product.discount_percentage}%` 
          : '-',
        formatCurrency(finalPrice),
      ];
    });

    doc.autoTable({
      startY: yPos,
      head: [['Art.-Nr.', 'Bezeichnung', 'Bestand', 'Rabatt', 'Preis (netto)']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: COLORS.navy,
        textColor: COLORS.white,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
        textColor: COLORS.textDark,
      },
      alternateRowStyles: {
        fillColor: COLORS.lightGray,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: 15, right: 15 },
      didDrawPage: () => {
        // This will be handled later for footers
      },
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // Vehicles section - new page
  if (vehicles.length > 0) {
    doc.addPage();
    currentPage++;
    await addHeader(doc, logoBase64);
    
    yPos = 45;
    
    // Section title for vehicles
    doc.setFontSize(20);
    doc.setTextColor(...COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.text('Fahrzeuge', 15, yPos);
    yPos += 15;

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
      
      yPos = addSectionTitle(doc, vehicleType, yPos);
      
      const tableData = typeVehicles.map(vehicle => {
        const finalPrice = vehicle.discount_percentage && vehicle.discount_percentage > 0
          ? vehicle.price * (1 - vehicle.discount_percentage / 100)
          : vehicle.price;
        
        const status = vehicle.is_sold ? 'Verkauft' : vehicle.is_reserved ? 'Reserviert' : 'Verfügbar';
        
        return [
          vehicle.vehicle_number || '-',
          `${vehicle.brand} ${vehicle.model}`,
          formatDate(vehicle.first_registration_date),
          `${vehicle.mileage.toLocaleString('de-DE')} km`,
          `${vehicle.power_hp || '-'} PS`,
          status,
          formatCurrency(finalPrice),
        ];
      });

      doc.autoTable({
        startY: yPos,
        head: [['Fzg.-Nr.', 'Fahrzeug', 'EZ', 'Km-Stand', 'Leistung', 'Status', 'Preis']],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: COLORS.navy,
          textColor: COLORS.white,
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
          textColor: COLORS.textDark,
        },
        alternateRowStyles: {
          fillColor: COLORS.lightGray,
        },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 45 },
          2: { cellWidth: 22 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 28, halign: 'right' },
        },
        margin: { left: 15, right: 15 },
      });

      yPos = doc.lastAutoTable.finalY + 15;
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
