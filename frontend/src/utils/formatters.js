/**
 * Utilitários para formatação de dados
 */

/**
 * Formata um número de CNPJ
 * @param {string} cnpj - CNPJ sem formatação
 * @returns {string} CNPJ formatado (XX.XXX.XXX/XXXX-XX)
 */
export const formatarCNPJ = (cnpj) => {
  if (!cnpj) return '';
  
  // Remover caracteres não numéricos
  const digitos = cnpj.replace(/\D/g, '');
  
  // Verificar se tem 14 dígitos
  if (digitos.length !== 14) return cnpj;
  
  // Formatação XX.XXX.XXX/XXXX-XX
  return digitos.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
};

/**
 * Formata um número de telefone
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado ((XX) XXXXX-XXXX ou (XX) XXXX-XXXX)
 */
export const formatarTelefone = (telefone) => {
  if (!telefone) return '';
  
  // Remover caracteres não numéricos
  const digitos = telefone.replace(/\D/g, '');
  
  // Verificar tamanho
  if (digitos.length < 10) return telefone;
  
  // Formatação (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
  if (digitos.length === 11) {
    return digitos.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  } else {
    return digitos.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
};

/**
 * Formata um valor em reais
 * @param {number|string} valor - Valor a ser formatado
 * @returns {string} Valor formatado como moeda (R$ X.XXX,XX)
 */
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  
  // Converter para número se for string
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
  
  // Formatar usando Intl.NumberFormat
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numero);
};

/**
 * Formata uma data ISO para formato brasileiro
 * @param {string} data - Data em formato ISO (YYYY-MM-DD)
 * @returns {string} Data formatada (DD/MM/YYYY)
 */
export const formatarData = (data) => {
  if (!data) return '';
  
  try {
    const dataObj = new Date(data);
    return new Intl.DateTimeFormat('pt-BR').format(dataObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return data;
  }
};

/**
 * Formata uma data e hora ISO para formato brasileiro
 * @param {string} dataHora - Data e hora em formato ISO
 * @returns {string} Data e hora formatada (DD/MM/YYYY HH:MM)
 */
export const formatarDataHora = (dataHora) => {
  if (!dataHora) return '';
  
  try {
    const dataObj = new Date(dataHora);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dataObj);
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return dataHora;
  }
}; 