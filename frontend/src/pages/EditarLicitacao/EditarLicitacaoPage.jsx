import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NovaLicitacao from '../NovaLicitacao/NovaLicitacaoPage';
import { toast } from 'react-toastify';

export default function EditarLicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Log para depuração
    console.log('EditarLicitacao - ID recebido:', id);
    
    if (!id) {
      console.error('ID da licitação não encontrado na URL');
      toast.error('ID da licitação não encontrado');
      navigate('/licitacoes');
    }
  }, [id, navigate]);

  if (!id) {
    return null;
  }

  return <NovaLicitacao />;
} 