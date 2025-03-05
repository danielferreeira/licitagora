router.put('/licitacoes/:id/fechamento', async (req, res) => {
  try {
    const { id } = req.params;
    const { valor_final, lucro_final, foi_ganha, motivo_perda } = req.body;
    
    const licitacao = await Licitacao.fecharLicitacao(id, {
      valor_final,
      lucro_final,
      foi_ganha,
      motivo_perda,
      data_fechamento: new Date(),
      status: 'Finalizada'
    });

    if (!licitacao) {
      return res.status(404).json({ error: 'Licitação não encontrada' });
    }

    res.json(licitacao);
  } catch (error) {
    console.error('Erro ao fechar licitação:', error);
    res.status(500).json({ error: 'Erro ao fechar licitação' });
  }
}); 