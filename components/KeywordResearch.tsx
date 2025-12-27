
import React, { useState } from 'react';
import { analyzeKeywords } from '../services/geminiService';
import { KeywordMetric, SearchIntent } from '../types';

const KeywordResearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<KeywordMetric[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults([]);
    try {
      const data = await analyzeKeywords(query);
      setResults(data.keywords);
      setSources(data.sources);
      setPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    setIsLoading(true);
    try {
      // Simula a geração de "mais duas páginas" pedindo variações adicionais
      const data = await analyzeKeywords(`${query} variações alternativas de cauda longa`);
      setResults(prev => [...prev, ...data.keywords]);
      setPage(p => p + 2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent.toLowerCase()) {
      case 'informational':
      case 'informacional': return 'bg-blue-100 text-blue-700';
      case 'transactional':
      case 'transacional': return 'bg-emerald-100 text-emerald-700';
      case 'navigational':
      case 'navegacional': return 'bg-purple-100 text-purple-700';
      case 'commercial':
      case 'comercial': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDifficultyColor = (diff: number) => {
    if (diff < 30) return 'text-emerald-500';
    if (diff < 60) return 'text-orange-500';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Big Data de Keywords</h2>
        <p className="text-slate-500 mt-2">Pesquisa em massa com até 50 variações por página.</p>
      </header>

      <form onSubmit={handleSearch} className="max-w-3xl">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder=""
            className="w-full pl-12 pr-28 md:pl-14 md:pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base md:text-lg text-indigo-900 font-medium"
          />
          <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400">
            <i className="fas fa-magnifying-glass text-lg md:text-xl"></i>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 px-4 md:px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors text-sm md:text-base"
          >
            {isLoading ? <i className="fas fa-spinner fa-spin"></i> : 'Analisar'}
          </button>
        </div>
      </form>

      {isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium animate-pulse">Escaneando volume massivo de dados...</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Palavra-chave</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Volume</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Dificuldade</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Intenção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{row.keyword}</div>
                        <div className="text-[11px] text-slate-400 mt-1 max-w-xs">{row.explanation}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-slate-700 font-medium">{row.volume.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${row.difficulty < 30 ? 'bg-emerald-500' : row.difficulty < 60 ? 'bg-orange-500' : 'bg-rose-500'}`}
                              style={{ width: `${row.difficulty}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold w-6 ${getDifficultyColor(row.difficulty)}`}>{row.difficulty}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getIntentColor(row.intent)}`}>
                          {row.intent}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <button 
              onClick={loadMore}
              disabled={isLoading}
              className="px-8 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Gerando Lote...' : 'Gerar Próximas 2 Páginas (+100 resultados)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeywordResearch;
