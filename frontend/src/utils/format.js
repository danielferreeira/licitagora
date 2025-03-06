export const formatCurrency = (value) => {
  if (!value) return 'R$ 0';
  
  // Converte para número para garantir
  const numero = Number(value);
  
  // Formata o número sem forçar casas decimais
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numero);
}; 