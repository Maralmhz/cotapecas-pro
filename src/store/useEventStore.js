import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { calcularResumoEvento, gerarRelatorioFechamento } from '../lib/calculations'

const useEventStore = create(
  persist(
    (set, get) => ({
      // Estado
      eventos: [],
      eventoAtivo: null,
      lojas: [],
      loading: false,
      error: null,
      view: 'cotacao', // 'cotacao' | 'dashboard' | 'relatorio'

      // Setar view
      setView: (view) => set({ view }),

      // Carregar eventos do Supabase
      carregarEventos: async () => {
        set({ loading: true })
        const { data, error } = await supabase
          .from('eventos')
          .select(`
            *,
            pecas:pecas(
              *,
              precos:precos_por_loja(*)
            )
          `)
          .order('created_at', { ascending: false })
        if (error) { set({ error: error.message, loading: false }); return }
        // Normalizar estrutura
        const eventosNorm = (data || []).map(ev => ({
          ...ev,
          stores: [], // carregado separado
          parts: (ev.pecas || []).map(p => ({
            id: p.id,
            name: p.nome,
            quantity: p.quantidade,
            unit: p.unidade,
            notes: p.observacoes,
            selectedStore: p.loja_selecionada,
            paymentType: p.forma_pagamento,
            status: p.status || 'pending',
            prices: Object.fromEntries(
              (p.precos || []).map(pr => [pr.loja_id, String(pr.preco)])
            )
          }))
        }))
        set({ eventos: eventosNorm, loading: false })
        if (eventosNorm.length > 0 && !get().eventoAtivo) {
          set({ eventoAtivo: eventosNorm[0].id })
        }
        // Carregar lojas
        await get().carregarLojas()
      },

      carregarLojas: async () => {
        const { data } = await supabase.from('lojas').select('*').order('ordem')
        set({ lojas: data || [] })
      },

      // Criar novo evento
      criarEvento: async (nome, descricao = '') => {
        const { data, error } = await supabase
          .from('eventos')
          .insert({ nome, descricao, status: 'aberto' })
          .select()
          .single()
        if (error) { set({ error: error.message }); return null }
        const novoEvento = { ...data, parts: [], stores: [] }
        set(state => ({ eventos: [novoEvento, ...state.eventos], eventoAtivo: data.id }))
        return data.id
      },

      // Selecionar evento ativo
      setEventoAtivo: (id) => set({ eventoAtivo: id }),

      // Obter evento ativo
      getEventoAtivo: () => {
        const { eventos, eventoAtivo } = get()
        return eventos.find(e => e.id === eventoAtivo) || null
      },

      // Importar pecas de texto colado
      importarPecas: async (eventoId, pecasImportadas, lojasImportadas) => {
        set({ loading: true })
        // Upsert lojas
        const lojasIds = {}
        for (const loja of lojasImportadas) {
          const { data: lojaExist } = await supabase
            .from('lojas')
            .select('id')
            .ilike('nome', loja.trim())
            .single()
          if (lojaExist) {
            lojasIds[loja] = lojaExist.id
          } else {
            const { data: novaLoja } = await supabase
              .from('lojas')
              .insert({ nome: loja.trim() })
              .select()
              .single()
            if (novaLoja) lojasIds[loja] = novaLoja.id
          }
        }
        // Inserir pecas
        for (const peca of pecasImportadas) {
          const { data: novaPeca } = await supabase
            .from('pecas')
            .insert({
              evento_id: eventoId,
              nome: peca.name,
              quantidade: peca.quantity || 1,
              unidade: peca.unit || 'un',
              observacoes: peca.notes || ''
            })
            .select()
            .single()
          if (novaPeca) {
            // Inserir precos
            const precosInsert = lojasImportadas
              .filter(l => peca.prices[l] != null)
              .map(l => ({
                peca_id: novaPeca.id,
                loja_id: lojasIds[l],
                preco: parseFloat(peca.prices[l]) || 0
              }))
            if (precosInsert.length > 0) {
              await supabase.from('precos_por_loja').insert(precosInsert)
            }
          }
        }
        // Reload
        await get().carregarEventos()
        set({ loading: false })
      },

      // Atualizar preco de uma peca em uma loja
      atualizarPreco: async (pecaId, lojaId, valor) => {
        const numVal = parseFloat(String(valor).replace(',', '.')) || 0
        const { data: exist } = await supabase
          .from('precos_por_loja')
          .select('id')
          .eq('peca_id', pecaId)
          .eq('loja_id', lojaId)
          .single()
        if (exist) {
          await supabase.from('precos_por_loja').update({ preco: numVal }).eq('id', exist.id)
        } else {
          await supabase.from('precos_por_loja').insert({ peca_id: pecaId, loja_id: lojaId, preco: numVal })
        }
        // Atualizar local
        set(state => ({
          eventos: state.eventos.map(ev => ({
            ...ev,
            parts: ev.parts.map(p => {
              if (p.id !== pecaId) return p
              return { ...p, prices: { ...p.prices, [lojaId]: String(numVal) } }
            })
          }))
        }))
      },

      // Selecionar loja para compra
      selecionarLoja: async (pecaId, lojaId, formaPagamento) => {
        await supabase.from('pecas').update({
          loja_selecionada: lojaId,
          forma_pagamento: formaPagamento,
          status: lojaId ? 'comprado' : 'pending'
        }).eq('id', pecaId)
        set(state => ({
          eventos: state.eventos.map(ev => ({
            ...ev,
            parts: ev.parts.map(p => {
              if (p.id !== pecaId) return p
              return { ...p, selectedStore: lojaId, paymentType: formaPagamento, status: lojaId ? 'comprado' : 'pending' }
            })
          }))
        }))
      },

      // Adicionar peca manualmente
      adicionarPeca: async (eventoId, nome, quantidade = 1) => {
        const { data } = await supabase
          .from('pecas')
          .insert({ evento_id: eventoId, nome, quantidade, unidade: 'un' })
          .select()
          .single()
        if (data) {
          const novaPeca = { id: data.id, name: data.nome, quantity: 1, unit: 'un', prices: {}, selectedStore: null, paymentType: null, status: 'pending' }
          set(state => ({
            eventos: state.eventos.map(ev =>
              ev.id === eventoId ? { ...ev, parts: [...ev.parts, novaPeca] } : ev
            )
          }))
        }
      },

      // Adicionar loja
      adicionarLoja: async (nome) => {
        const { data } = await supabase.from('lojas').insert({ nome }).select().single()
        if (data) set(state => ({ lojas: [...state.lojas, data] }))
        return data
      },

      // Fechar evento
      fecharEvento: async (eventoId) => {
        const evento = get().eventos.find(e => e.id === eventoId)
        if (!evento) return
        const resumo = calcularResumoEvento(evento)
        await supabase.from('eventos').update({
          status: 'fechado',
          total_economizado: resumo.economia,
          data_fechamento: new Date().toISOString()
        }).eq('id', eventoId)
        set(state => ({
          eventos: state.eventos.map(e =>
            e.id === eventoId ? { ...e, status: 'fechado' } : e
          )
        }))
      },

      // Deletar peca
      deletarPeca: async (pecaId) => {
        await supabase.from('pecas').delete().eq('id', pecaId)
        set(state => ({
          eventos: state.eventos.map(ev => ({
            ...ev,
            parts: ev.parts.filter(p => p.id !== pecaId)
          }))
        }))
      },

      // Atualizar status peca
      atualizarStatusPeca: async (pecaId, status) => {
        await supabase.from('pecas').update({ status }).eq('id', pecaId)
        set(state => ({
          eventos: state.eventos.map(ev => ({
            ...ev,
            parts: ev.parts.map(p => p.id === pecaId ? { ...p, status } : p)
          }))
        }))
      },
    }),
    {
      name: 'cotapecas-storage',
      partialize: (state) => ({ eventoAtivo: state.eventoAtivo })
    }
  )
)

export default useEventStore
