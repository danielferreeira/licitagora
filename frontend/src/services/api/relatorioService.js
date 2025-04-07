import { supabase, executarSQL, verificarAutenticacao } from './supabaseConfig';
import authService from './authService';

// Serviço para geração de relatórios
const relatorioService = {
  // Gerar relatório de licitações
  async gerarRelatorioLicitacoes(filtros = {}) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      console.log('Gerando relatório de licitações com filtros:', filtros);
      
      // Construir a consulta SQL com filtros
      let sql = `
        WITH dados_licitacoes AS (
          SELECT
            l.id,
            l.numero,
            l.objeto,
            l.cliente_id,
            c.nome as cliente_nome,
            c.franquia_id,
            f.nome as franquia_nome,
            l.modalidade,
            l.valor_estimado,
            l.status,
            l.data_abertura,
            l.data_fechamento,
            l.vencedor,
            l.valor_final
          FROM
            licitacoes l
            JOIN clientes c ON l.cliente_id = c.id
            LEFT JOIN franquias f ON c.franquia_id = f.id
          WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Verificar se é admin para decidir se filtra por franquia
      const { data: isAdmin } = await supabase.rpc('verificar_permissao_admin', {
        p_user_id: user.id
      });
      
      if (!isAdmin) {
        const { data: franquiaId } = await supabase.rpc('obter_franquia_do_usuario', {
          p_user_id: user.id
        });
        
        if (franquiaId) {
          sql += ` AND c.franquia_id = $${paramIndex}`;
          params.push(franquiaId);
          paramIndex++;
        } else {
          // Se não for admin e não tiver franquia, não retorna nada
          return {
            resumo: {
              total: 0,
              em_andamento: 0,
              concluidas: 0,
              valor_estimado_total: 0,
              valor_final_total: 0
            },
            detalhes: []
          };
        }
      }
      
      // Adicionar filtros extras
      if (filtros.dataInicio) {
        sql += ` AND l.data_abertura >= $${paramIndex}`;
        params.push(filtros.dataInicio);
        paramIndex++;
      }
      
      if (filtros.dataFim) {
        sql += ` AND l.data_abertura <= $${paramIndex}`;
        params.push(filtros.dataFim);
        paramIndex++;
      }
      
      if (filtros.status && filtros.status !== 'TODOS') {
        sql += ` AND l.status = $${paramIndex}`;
        params.push(filtros.status);
        paramIndex++;
      }
      
      if (filtros.cliente_id) {
        sql += ` AND l.cliente_id = $${paramIndex}`;
        params.push(filtros.cliente_id);
        paramIndex++;
      }
      
      // Fechar a CTE e fazer a consulta final
      sql += `
        )
        SELECT
          json_build_object(
            'resumo', json_build_object(
              'total', COUNT(id),
              'em_andamento', SUM(CASE WHEN status NOT IN ('CONCLUIDA', 'CANCELADA') THEN 1 ELSE 0 END),
              'concluidas', SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END),
              'canceladas', SUM(CASE WHEN status = 'CANCELADA' THEN 1 ELSE 0 END),
              'valor_estimado_total', COALESCE(SUM(valor_estimado), 0),
              'valor_final_total', COALESCE(SUM(valor_final), 0)
            ),
            'detalhes', COALESCE(json_agg(
              json_build_object(
                'id', id,
                'numero', numero,
                'objeto', objeto,
                'cliente_id', cliente_id,
                'cliente_nome', cliente_nome,
                'franquia_id', franquia_id,
                'franquia_nome', franquia_nome,
                'modalidade', modalidade,
                'valor_estimado', valor_estimado,
                'status', status,
                'data_abertura', data_abertura,
                'data_fechamento', data_fechamento,
                'vencedor', vencedor,
                'valor_final', valor_final
              )
            ), '[]'::json)
          ) as resultado
        FROM dados_licitacoes
      `;
      
      console.log('SQL do relatório:', sql);
      console.log('Parâmetros:', params);
      
      // Executar a consulta SQL
      const { data, error } = await supabase.rpc('executar_sql_com_params', {
        p_sql: sql,
        p_params: params
      });
      
      if (error) {
        console.error('Erro SQL ao gerar relatório de licitações:', error);
        throw error;
      }
      
      // Processar o resultado
      if (data && data.length > 0 && data[0].resultado) {
        return data[0].resultado;
      } else {
        console.warn('Nenhum dado retornado para o relatório de licitações');
        return {
          resumo: {
            total: 0,
            em_andamento: 0,
            concluidas: 0,
            valor_estimado_total: 0,
            valor_final_total: 0
          },
          detalhes: []
        };
      }
    } catch (err) {
      console.error('Exceção ao gerar relatório de licitações:', err);
      throw err;
    }
  },
  
  // Gerar relatório de clientes
  async gerarRelatorioClientes(filtros = {}) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Verificar se é admin para decidir se filtra por franquia
      const { data: isAdmin } = await supabase.rpc('verificar_permissao_admin', {
        p_user_id: user.id
      });
      
      let franquiaId = null;
      if (!isAdmin) {
        const { data: userFranquiaId } = await supabase.rpc('obter_franquia_do_usuario', {
          p_user_id: user.id
        });
        franquiaId = userFranquiaId;
      }
      
      // Construir SQL para relatório de clientes
      let sql = `
        WITH dados_clientes AS (
          SELECT
            c.id,
            c.nome,
            c.cnpj,
            c.email,
            c.telefone,
            c.cidade,
            c.estado,
            c.franquia_id,
            f.nome as franquia_nome,
            (
              SELECT COUNT(l.id)
              FROM licitacoes l
              WHERE l.cliente_id = c.id
            ) as total_licitacoes,
            (
              SELECT COUNT(l.id)
              FROM licitacoes l
              WHERE l.cliente_id = c.id
              AND l.status = 'CONCLUIDA'
            ) as licitacoes_concluidas,
            (
              SELECT COALESCE(SUM(l.valor_final), 0)
              FROM licitacoes l
              WHERE l.cliente_id = c.id
              AND l.status = 'CONCLUIDA'
            ) as valor_total_licitacoes
          FROM
            clientes c
            LEFT JOIN franquias f ON c.franquia_id = f.id
          WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Adicionar filtro de franquia se necessário
      if (franquiaId) {
        sql += ` AND c.franquia_id = $${paramIndex}`;
        params.push(franquiaId);
        paramIndex++;
      }
      
      // Fechar a CTE e fazer a consulta final
      sql += `
        )
        SELECT
          json_build_object(
            'resumo', json_build_object(
              'total_clientes', COUNT(id),
              'clientes_com_licitacoes', COUNT(CASE WHEN total_licitacoes > 0 THEN 1 END),
              'clientes_sem_licitacoes', COUNT(CASE WHEN total_licitacoes = 0 THEN 1 END),
              'valor_total_licitacoes', COALESCE(SUM(valor_total_licitacoes), 0),
              'media_licitacoes_por_cliente', CASE WHEN COUNT(id) > 0 THEN ROUND(SUM(total_licitacoes)::numeric / COUNT(id), 2) ELSE 0 END
            ),
            'detalhes', COALESCE(json_agg(
              json_build_object(
                'id', id,
                'nome', nome,
                'cnpj', cnpj,
                'email', email,
                'telefone', telefone,
                'cidade', cidade,
                'estado', estado,
                'franquia_id', franquia_id,
                'franquia_nome', franquia_nome,
                'total_licitacoes', total_licitacoes,
                'licitacoes_concluidas', licitacoes_concluidas,
                'valor_total_licitacoes', valor_total_licitacoes
              )
            ), '[]'::json)
          ) as resultado
        FROM dados_clientes
      `;
      
      // Executar a consulta SQL
      const { data, error } = await supabase.rpc('executar_sql_com_params', {
        p_sql: sql,
        p_params: params
      });
      
      if (error) {
        console.error('Erro SQL ao gerar relatório de clientes:', error);
        throw error;
      }
      
      // Processar o resultado
      if (data && data.length > 0 && data[0].resultado) {
        return data[0].resultado;
      } else {
        return {
          resumo: {
            total_clientes: 0,
            clientes_com_licitacoes: 0,
            clientes_sem_licitacoes: 0,
            valor_total_licitacoes: 0,
            media_licitacoes_por_cliente: 0
          },
          detalhes: []
        };
      }
    } catch (err) {
      console.error('Exceção ao gerar relatório de clientes:', err);
      throw err;
    }
  },
  
  // Gerar relatório de desempenho
  async gerarRelatorioDesempenho(filtros = {}) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Verificar se é admin para decidir se filtra por franquia
      const { data: isAdmin } = await supabase.rpc('verificar_permissao_admin', {
        p_user_id: user.id
      });
      
      let franquiaId = null;
      if (!isAdmin) {
        const { data: userFranquiaId } = await supabase.rpc('obter_franquia_do_usuario', {
          p_user_id: user.id
        });
        franquiaId = userFranquiaId;
      }
      
      // Determinar o período baseado nos filtros
      let groupByFormat = "to_char(l.data_abertura, 'YYYY-MM')";
      let periodLabel = "to_char(l.data_abertura, 'Mon/YYYY')";
      
      if (filtros.periodo === 'semanal') {
        groupByFormat = "to_char(date_trunc('week', l.data_abertura), 'YYYY-MM-DD')";
        periodLabel = "concat('Semana de ', to_char(date_trunc('week', l.data_abertura), 'DD/MM/YYYY'))";
      } else if (filtros.periodo === 'trimestral') {
        groupByFormat = "concat(extract(year from l.data_abertura), '-', extract(quarter from l.data_abertura))";
        periodLabel = "concat(extract(quarter from l.data_abertura), 'º Trim/', extract(year from l.data_abertura))";
      } else if (filtros.periodo === 'anual') {
        groupByFormat = "extract(year from l.data_abertura)::text";
        periodLabel = "extract(year from l.data_abertura)::text";
      }
      
      // Construir SQL para relatório de desempenho
      let sql = `
        WITH dados_base AS (
          SELECT
            l.id,
            l.numero,
            l.cliente_id,
            c.nome as cliente_nome,
            c.franquia_id,
            f.nome as franquia_nome,
            l.modalidade,
            l.status,
            l.data_abertura,
            l.data_fechamento,
            l.valor_estimado,
            l.valor_final,
            ${groupByFormat} as periodo_grupo,
            ${periodLabel} as periodo_label
          FROM
            licitacoes l
            JOIN clientes c ON l.cliente_id = c.id
            LEFT JOIN franquias f ON c.franquia_id = f.id
          WHERE 
            l.data_abertura IS NOT NULL
      `;
      
      const params = [];
      let paramIndex = 1;
      
      // Adicionar filtro de franquia se necessário
      if (franquiaId) {
        sql += ` AND c.franquia_id = $${paramIndex}`;
        params.push(franquiaId);
        paramIndex++;
      }
      
      // Adicionar filtros extras
      if (filtros.dataInicio) {
        sql += ` AND l.data_abertura >= $${paramIndex}`;
        params.push(filtros.dataInicio);
        paramIndex++;
      }
      
      if (filtros.dataFim) {
        sql += ` AND l.data_abertura <= $${paramIndex}`;
        params.push(filtros.dataFim);
        paramIndex++;
      }
      
      // Continuar construindo a query para agregação por período
      sql += `
        ),
        dados_por_periodo AS (
          SELECT
            periodo_grupo,
            periodo_label,
            COUNT(id) as total_licitacoes,
            COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) as licitacoes_concluidas,
            COUNT(CASE WHEN status = 'CANCELADA' THEN 1 END) as licitacoes_canceladas,
            COALESCE(SUM(valor_estimado), 0) as valor_estimado_total,
            COALESCE(SUM(CASE WHEN status = 'CONCLUIDA' THEN valor_final ELSE 0 END), 0) as valor_final_total
          FROM
            dados_base
          GROUP BY
            periodo_grupo, periodo_label
          ORDER BY
            periodo_grupo
        )
        SELECT
          json_build_object(
            'periodos', COALESCE(json_agg(
              json_build_object(
                'periodo', periodo_label,
                'total_licitacoes', total_licitacoes,
                'licitacoes_concluidas', licitacoes_concluidas,
                'licitacoes_canceladas', licitacoes_canceladas,
                'valor_estimado_total', valor_estimado_total,
                'valor_final_total', valor_final_total
              ) ORDER BY periodo_grupo
            ), '[]'::json),
            'resumo', (
              SELECT
                json_build_object(
                  'total_licitacoes', COALESCE(SUM(total_licitacoes), 0),
                  'licitacoes_concluidas', COALESCE(SUM(licitacoes_concluidas), 0),
                  'licitacoes_canceladas', COALESCE(SUM(licitacoes_canceladas), 0),
                  'valor_estimado_total', COALESCE(SUM(valor_estimado_total), 0),
                  'valor_final_total', COALESCE(SUM(valor_final_total), 0),
                  'media_licitacoes_por_periodo', CASE WHEN COUNT(*) > 0 THEN ROUND(SUM(total_licitacoes)::numeric / COUNT(*), 2) ELSE 0 END
                )
              FROM dados_por_periodo
            )
          ) as resultado
      `;
      
      // Executar a consulta SQL
      const { data, error } = await supabase.rpc('executar_sql_com_params', {
        p_sql: sql,
        p_params: params
      });
      
      if (error) {
        console.error('Erro SQL ao gerar relatório de desempenho:', error);
        throw error;
      }
      
      // Processar o resultado
      if (data && data.length > 0 && data[0].resultado) {
        return data[0].resultado;
      } else {
        return {
          periodos: [],
          resumo: {
            total_licitacoes: 0,
            licitacoes_concluidas: 0,
            licitacoes_canceladas: 0,
            valor_estimado_total: 0,
            valor_final_total: 0,
            media_licitacoes_por_periodo: 0
          }
        };
      }
    } catch (err) {
      console.error('Exceção ao gerar relatório de desempenho:', err);
      throw err;
    }
  }
};

export default relatorioService; 