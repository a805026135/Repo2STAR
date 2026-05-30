import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  repos: [],
  starPoints: [],
  matchHistory: [],
  agentLogs: [],
  activeView: 'dashboard',
  analysisRunning: {},
  skillProfile: null,
  suggestions: [],
  interviewPreps: [],
  settings: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REPOS':
      return { ...state, repos: action.payload };
    case 'ADD_REPOS':
      return { ...state, repos: [...state.repos, ...action.payload] };
    case 'UPDATE_REPO':
      return { ...state, repos: state.repos.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'REMOVE_REPO':
      return { ...state, repos: state.repos.filter(r => r.id !== action.payload) };
    case 'SET_STAR_POINTS':
      return { ...state, starPoints: action.payload };
    case 'ADD_STAR_POINTS':
      return { ...state, starPoints: [...action.payload, ...state.starPoints] };
    case 'UPDATE_STAR':
      return { ...state, starPoints: state.starPoints.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'SET_MATCH_HISTORY':
      return { ...state, matchHistory: action.payload };
    case 'ADD_MATCH':
      return { ...state, matchHistory: [action.payload, ...state.matchHistory] };
    case 'SET_LOGS':
      return { ...state, agentLogs: action.payload };
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_ANALYSIS_RUNNING':
      return { ...state, analysisRunning: { ...state.analysisRunning, [action.payload.repoId]: action.payload.running } };
    case 'SET_SKILL_PROFILE':
      return { ...state, skillProfile: action.payload };
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'UPDATE_SUGGESTION':
      return { ...state, suggestions: state.suggestions.filter(s => s.id !== action.payload) };
    case 'SET_INTERVIEW_PREPS':
      return { ...state, interviewPreps: action.payload };
    case 'ADD_INTERVIEW_PREP':
      return { ...state, interviewPreps: [action.payload, ...state.interviewPreps] };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'LOGOUT':
      api.setToken(null);
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      api.setToken(token);
      window.history.replaceState({}, '', '/');
    }

    if (api.token) {
      api.getMe()
        .then(user => dispatch({ type: 'SET_USER', payload: user }))
        .catch(() => {
          api.setToken(null);
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadRepos = useCallback(async () => {
    try { const repos = await api.getManagedRepos(); dispatch({ type: 'SET_REPOS', payload: repos }); } catch {}
  }, []);

  const loadStarPoints = useCallback(async () => {
    try { const points = await api.getAllStarPoints(); dispatch({ type: 'SET_STAR_POINTS', payload: points }); } catch {}
  }, []);

  const loadMatchHistory = useCallback(async () => {
    try { const matches = await api.getMatchHistory(); dispatch({ type: 'SET_MATCH_HISTORY', payload: matches }); } catch {}
  }, []);

  const loadLogs = useCallback(async () => {
    try { const logs = await api.getAgentLogs(); dispatch({ type: 'SET_LOGS', payload: logs }); } catch {}
  }, []);

  const loadSuggestions = useCallback(async () => {
    try { const suggestions = await api.getSuggestions(); dispatch({ type: 'SET_SUGGESTIONS', payload: suggestions }); } catch {}
  }, []);

  const loadSettings = useCallback(async () => {
    try { const settings = await api.getSettings(); dispatch({ type: 'SET_SETTINGS', payload: settings }); } catch {}
  }, []);

  const loadInterviewPreps = useCallback(async () => {
    try { const preps = await api.getInterviewPrepList(); dispatch({ type: 'SET_INTERVIEW_PREPS', payload: preps }); } catch {}
  }, []);

  const logout = useCallback(() => dispatch({ type: 'LOGOUT' }), []);

  return (
    <AppContext.Provider value={{
      ...state,
      dispatch,
      loadRepos,
      loadStarPoints,
      loadMatchHistory,
      loadLogs,
      loadSuggestions,
      loadSettings,
      loadInterviewPreps,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
