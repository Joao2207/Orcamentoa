
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Quote, CompanySettings, Customer } from '../types';
import { format } from 'date-fns';

export const generateQuotePDF = (quote: Quote, settings: CompanySettings, customer: Customer) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - Logo
  if (settings.logoBase64) {
    doc.addImage(settings.logoBase64, 'PNG', 15, 15, 30, 30);
  }

  // Header - Company Info
  doc.setFontSize(20);
  doc.setTextColor(40);
  doc.text(settings.companyName, 50, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Proprietária: ${settings.ownerName}`, 50, 32);
  doc.text(`Contato: ${settings.phone}${settings.email ? ` | ${settings.email}` : ''}`, 50, 38);

  // Quote Header
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text('ORÇAMENTO', pageWidth - 15, 25, { align: 'right' });
  doc.setFontSize(10);
  doc.text(`Nº: ${quote.id || 'Draft'}`, pageWidth - 15, 32, { align: 'right' });
  doc.text(`Data: ${format(new Date(quote.date), 'dd/MM/yyyy')}`, pageWidth - 15, 38, { align: 'right' });
  doc.text(`Validade: ${format(new Date(quote.validity), 'dd/MM/yyyy')}`, pageWidth - 15, 44, { align: 'right' });

  // Divider
  doc.setDrawColor(200);
  doc.line(15, 55, pageWidth - 15, 55);

  // Customer Info
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.text('DADOS DO CLIENTE', 15, 65);
  doc.setFontSize(10);
  doc.text(`Nome: ${customer.name}`, 15, 72);
  doc.text(`Telefone: ${customer.phone}`, 15, 78);
  if (customer.email) doc.text(`E-mail: ${customer.email}`, 15, 84);

  // Table
  const tableData = quote.items.map(item => [
    item.name,
    item.unit || '-',
    item.quantity.toString(),
    `R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `R$ ${item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  (doc as any).autoTable({
    startY: 95,
    head: [['Produto', 'Unid.', 'Qtd', 'Unitário', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.setFontSize(10);
  doc.text('Subtotal:', pageWidth - 60, finalY);
  doc.text(`R$ ${(quote.total + quote.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, finalY, { align: 'right' });
  
  doc.text('Desconto:', pageWidth - 60, finalY + 6);
  doc.text(`- R$ ${quote.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, finalY + 6, { align: 'right' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - 60, finalY + 15);
  doc.text(`R$ ${quote.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 15, finalY + 15, { align: 'right' });

  // Observations
  if (quote.observations) {
    const splitObs = doc.splitTextToSize(`Observações: ${quote.observations}`, pageWidth - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(splitObs, 15, finalY + 30);
  }

  return doc;
};
