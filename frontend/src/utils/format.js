// Formata valores monetários
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

// Formata datas para o padrão brasileiro
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const data = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

// Formata data e hora
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const data = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '';
  }
};

// Formata números com separadores de milhar
export const formatNumber = (value) => {
  if (!value) return '0';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};

// Formata percentual
export const formatPercent = (value) => {
  if (!value) return '0%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(value / 100);
};

// Formata CNPJ
export const formatCNPJ = (cnpj) => {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  const numeros = cnpj.replace(/\D/g, '');
  
  // Aplica a máscara
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

// Formata CPF
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const numeros = cpf.replace(/\D/g, '');
  
  // Aplica a máscara
  return numeros.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
};

// Formata telefone
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const numeros = phone.replace(/\D/g, '');
  
  // Verifica se é celular (9 dígitos) ou fixo (8 dígitos)
  if (numeros.length === 11) {
    return numeros.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  return numeros.replace(
    /^(\d{2})(\d{4})(\d{4})$/,
    '($1) $2-$3'
  );
};

// Formata CEP
export const formatCEP = (cep) => {
  if (!cep) return '';
  
  // Remove caracteres não numéricos
  const numeros = cep.replace(/\D/g, '');
  
  // Aplica a máscara
  return numeros.replace(
    /^(\d{5})(\d{3})$/,
    '$1-$2'
  );
}; 