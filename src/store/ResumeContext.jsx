import { createContext, useContext, useReducer, useCallback } from 'react';
import { defaultResumeData, defaultEducation, defaultWork, defaultInternship, defaultProject, defaultCertificate } from '../data/defaultResume';

const ResumeContext = createContext(null);

const initialState = {
  resumeData: { ...defaultResumeData },
  activeTemplate: 'classic',
  activeSection: 'personal',
  enabledSections: ['education', 'work', 'internship', 'projects', 'skills', 'certificates', 'selfEval'],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PERSONAL':
      return { ...state, resumeData: { ...state.resumeData, personal: { ...state.resumeData.personal, ...action.payload } } };

    case 'SET_FIELD':
      return { ...state, resumeData: { ...state.resumeData, [action.section]: action.payload } };

    case 'UPDATE_FIELD':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [action.section]: state.resumeData[action.section].map((item) =>
            item.id === action.id ? { ...item, ...action.payload } : item,
          ),
        },
      };

    case 'ADD_ITEM': {
      const creators = { education: defaultEducation, work: defaultWork, internship: defaultInternship, projects: defaultProject, certificates: defaultCertificate };
      const newItem = creators[action.section]?.();
      if (!newItem) return state;
      return { ...state, resumeData: { ...state.resumeData, [action.section]: [...state.resumeData[action.section], newItem] } };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          [action.section]: state.resumeData[action.section].filter((item) => item.id !== action.id),
        },
      };

    case 'SET_TEMPLATE':
      return { ...state, activeTemplate: action.payload };

    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };

    case 'TOGGLE_SECTION': {
      const key = action.payload;
      const enabled = state.enabledSections.includes(key)
        ? state.enabledSections.filter((s) => s !== key)
        : [...state.enabledSections, key];
      return { ...state, enabledSections: enabled };
    }

    case 'LOAD_RESUME':
      return { ...state, resumeData: { ...defaultResumeData, ...action.payload } };

    case 'MERGE_RESUME':
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          ...Object.fromEntries(
            Object.entries(action.payload).map(([k, v]) => [
              k,
              Array.isArray(v) ? [...(state.resumeData[k] || []), ...v] : typeof v === 'object' && v !== null ? { ...state.resumeData[k], ...v } : v,
            ]),
          ),
        },
      };

    default:
      return state;
  }
}

export function ResumeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const updatePersonal = useCallback((data) => dispatch({ type: 'SET_PERSONAL', payload: data }), []);
  const setField = useCallback((section, payload) => dispatch({ type: 'SET_FIELD', section, payload }), []);
  const updateField = useCallback((section, id, payload) => dispatch({ type: 'UPDATE_FIELD', section, id, payload }), []);
  const addItem = useCallback((section) => dispatch({ type: 'ADD_ITEM', section }), []);
  const removeItem = useCallback((section, id) => dispatch({ type: 'REMOVE_ITEM', section, id }), []);
  const setTemplate = useCallback((t) => dispatch({ type: 'SET_TEMPLATE', payload: t }), []);
  const setActiveSection = useCallback((s) => dispatch({ type: 'SET_ACTIVE_SECTION', payload: s }), []);
  const toggleSection = useCallback((s) => dispatch({ type: 'TOGGLE_SECTION', payload: s }), []);
  const loadResume = useCallback((data) => dispatch({ type: 'LOAD_RESUME', payload: data }), []);
  const mergeResume = useCallback((data) => dispatch({ type: 'MERGE_RESUME', payload: data }), []);

  return (
    <ResumeContext.Provider value={{ ...state, updatePersonal, setField, updateField, addItem, removeItem, setTemplate, setActiveSection, toggleSection, loadResume, mergeResume }}>
      {children}
    </ResumeContext.Provider>
  );
}

export const useResume = () => {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
};
