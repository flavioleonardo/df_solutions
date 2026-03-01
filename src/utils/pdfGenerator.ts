import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ShoppingList } from '../types';

export const generatePDF = (list: ShoppingList) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 20);
  doc.text('LISTA DE COMPRAS', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('DF SOLUTIONS - GESTÃO INTELIGENTE', pageWidth / 2, 28, { align: 'center' });

  // Company & Client Info
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, pageWidth - 20, 35);

  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA EMPRESA', 20, 45);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Empresa: ${list.company_name || 'N/A'}`, 20, 52);
  if (list.supplier_name) {
    doc.text(`Fornecedor: ${list.supplier_name}`, 20, 57);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DADOS DO CLIENTE', pageWidth / 2 + 10, 45);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Cliente: ${list.user_name || 'N/A'}`, pageWidth / 2 + 10, 52);
  doc.text(`Data: ${new Date(list.created_at).toLocaleString('pt-BR')}`, pageWidth / 2 + 10, 57);
  doc.text(`ID da Lista: ${list.id}`, pageWidth / 2 + 10, 62);

  doc.line(20, 68, pageWidth - 20, 68);

  // Table
  const tableData = list.items?.map(item => [
    item.product_name || 'N/A',
    `${item.quantity} ${item.unit || 'un'}`,
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0),
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((item.price || 0) * item.quantity)
  ]) || [];

  autoTable(doc, {
    startY: 75,
    head: [['Produto', 'Qtd', 'Preço Unit.', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 240] },
    margin: { left: 20, right: 20 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable?.finalY || 80;
  const total = list.items?.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0) || 0;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 20, 20);
  doc.text(
    `TOTAL ESTIMADO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`,
    pageWidth - 20,
    finalY + 15,
    { align: 'right' }
  );

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Este documento é uma estimativa de valores baseada nos preços cadastrados no sistema.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

  return doc;
};
