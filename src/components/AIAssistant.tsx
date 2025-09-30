import React, { useState, useEffect } from 'react';
import { aiApi } from '../services/api';
import { Bot, Lightbulb, TrendingUp, Loader, AlertCircle, Search, Send } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [suggestions, setSuggestions] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'analysis'>('search');

  useEffect(() => {
    if (activeTab === 'search') {
      // Don't auto-load search results
    } else if (activeTab === 'suggestions') {
      loadSuggestions();
    } else {
      loadAnalysis();
    }
  }, [activeTab]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await aiApi.getSuggestions();
      setSuggestions(response.data.suggestions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await aiApi.getExpiryAnalysis();
      setAnalysis(response.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load expiry analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      setError('');
      const response = await aiApi.search(searchQuery);
      setSearchResults(response.data.results);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to search AI knowledge base');
      setSearchResults('');
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults('');
    setError('');
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.trim().match(/^\d+\./)) {
        return (
          <div key={index} className="flex items-start space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-700">{line.trim()}</p>
          </div>
        );
      }
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
        return (
          <h4 key={index} className="font-semibold text-gray-900 mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      return line.trim() ? (
        <p key={index} className="text-gray-700 mb-2">
          {line}
        </p>
      ) : null;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-600">Get intelligent insights for waste reduction</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'suggestions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lightbulb className="h-4 w-4" />
            <span>Suggestions</span>
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Analysis</span>
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
          {activeTab === 'search' ? (
            <div className="space-y-4">
              {/* Search Form */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask me anything about waste management, inventory optimization, or food safety..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {searchLoading ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Search</span>
                  </button>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear search
                  </button>
                )}
              </form>

              {/* Search Results */}
              {searchResults && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
                  <div className="prose prose-sm max-w-none text-blue-800">
                    {formatText(searchResults)}
                  </div>
                </div>
              )}

              {/* Example Questions */}
              {!searchResults && !searchLoading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Example questions you can ask:</h4>
                  <div className="space-y-2">
                    {[
                      "How can I reduce food waste in my restaurant?",
                      "What's the best way to store vegetables to extend shelf life?",
                      "How do I optimize my inventory ordering schedule?",
                      "What are the signs that meat has gone bad?",
                      "How can I train my staff to minimize waste?"
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(question)}
                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm rounded border border-transparent hover:border-gray-200 transition-all"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Generating insights...</span>
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Unable to load AI insights</p>
                <p className="text-red-600 text-sm">{error}</p>
                <button
                  onClick={activeTab === 'suggestions' ? loadSuggestions : loadAnalysis}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {activeTab === 'suggestions' ? (
                <div>
                  {suggestions ? formatText(suggestions) : (
                    <p className="text-gray-500 italic">No suggestions available yet.</p>
                  )}
                </div>
              ) : (
                <div>
                  {analysis ? formatText(analysis) : (
                    <p className="text-gray-500 italic">No analysis available yet.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          {activeTab !== 'search' && (
            <button
              onClick={activeTab === 'suggestions' ? loadSuggestions : loadAnalysis}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Bot className="h-4 w-4" />
              <span>Refresh {activeTab === 'suggestions' ? 'Suggestions' : 'Analysis'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;