import { useState, useCallback, useEffect } from 'react';
import { AppState, Form, Question, Response, User, AppView } from '../types';

const initialState: AppState = {
	currentView: 'login',
	user: null,
	forms: [],
	currentForm: null,
	responses: [],
	isLoading: false,
};

// Helper functions for localStorage persistence
const saveUserToStorage = (user: User | null) => {
	if (user) {
		localStorage.setItem('typeform_user', JSON.stringify(user));
	} else {
		localStorage.removeItem('typeform_user');
	}
};

const getUserFromStorage = (): User | null => {
	try {
		const stored = localStorage.getItem('typeform_user');
		return stored ? JSON.parse(stored) : null;
	} catch {
		return null;
	}
};

export const useAppState = () => {
	const [state, setState] = useState<AppState>(() => {
		// Initialize with stored user if available
		const storedUser = getUserFromStorage();
		const path = typeof window !== 'undefined' ? window.location.pathname : '';
		const isPublicFormRoute = /^\/form\/.+$/i.test(path);
		return {
			...initialState,
			user: storedUser,
			currentView: isPublicFormRoute ? 'splash' : storedUser ? 'dashboard' : 'login',
			isLoading: isPublicFormRoute ? true : initialState.isLoading,
		};
	});

	const setView = useCallback((view: AppView) => {
		setState((prev) => ({ ...prev, currentView: view }));
	}, []);

	const setUser = useCallback((user: User | null) => {
		setState((prev) => ({ ...prev, user }));
		saveUserToStorage(user);
	}, []);

	const setCurrentForm = useCallback((form: Form | null) => {
		setState((prev) => ({ ...prev, currentForm: form }));
	}, []);

	const setForms = useCallback((forms: Form[]) => {
		setState((prev) => ({ ...prev, forms }));
	}, []);

	const addForm = useCallback((form: Form) => {
		setState((prev) => ({
			...prev,
			forms: [...prev.forms, form],
			currentForm: form,
		}));
	}, []);

	const updateForm = useCallback((updatedForm: Form) => {
		setState((prev) => ({
			...prev,
			forms: prev.forms.map((form) => (form.id === updatedForm.id ? updatedForm : form)),
			currentForm: prev.currentForm?.id === updatedForm.id ? updatedForm : prev.currentForm,
		}));
	}, []);

	const deleteForm = useCallback((formId: string) => {
		setState((prev) => ({
			...prev,
			forms: prev.forms.filter((form) => form.id !== formId),
			currentForm: prev.currentForm?.id === formId ? null : prev.currentForm,
		}));
	}, []);

	const addQuestion = useCallback(
		(question: Question) => {
			if (!state.currentForm) return;

			const updatedForm = {
				...state.currentForm,
				questions: [...state.currentForm.questions, question],
			};
			updateForm(updatedForm);
		},
		[state.currentForm, updateForm]
	);

	const updateQuestion = useCallback(
		(questionId: string, updates: Partial<Question>) => {
			if (!state.currentForm) return;

			const updatedForm = {
				...state.currentForm,
				questions: state.currentForm.questions.map((q) =>
					q.id === questionId ? { ...q, ...updates } : q
				),
			};
			updateForm(updatedForm);
		},
		[state.currentForm, updateForm]
	);

	const deleteQuestion = useCallback(
		(questionId: string) => {
			if (!state.currentForm) return;

			const updatedForm = {
				...state.currentForm,
				questions: state.currentForm.questions.filter((q) => q.id !== questionId),
			};
			updateForm(updatedForm);
		},
		[state.currentForm, updateForm]
	);

	const addResponse = useCallback((response: Response) => {
		setState((prev) => ({
			...prev,
			responses: [...prev.responses, response],
			forms: prev.forms.map((form) =>
				form.id === response.formId ? { ...form, responseCount: form.responseCount + 1 } : form
			),
		}));
	}, []);

	const setResponses = useCallback((responses: Response[]) => {
		setState((prev) => ({ ...prev, responses }));
	}, []);

	const setLoading = useCallback((isLoading: boolean) => {
		setState((prev) => ({ ...prev, isLoading }));
	}, []);

	// Mock data initialization
	const initializeMockData = useCallback(() => {
		const mockUser: User = {
			id: '1',
			email: 'user@example.com',
			name: 'João Silva',
		};

		const mockForms: Form[] = [
			{
				id: '1',
				title: 'Pesquisa de Satisfação',
				description: 'Avalie nossa experiência de atendimento',
				createdAt: '2024-01-15T10:00:00Z',
				updatedAt: '2024-01-15T10:00:00Z',
				userId: '1',
				isPublished: true,
				responseCount: 23,
				questions: [
					{
						id: '1',
						type: 'rating',
						title: 'Como você avalia nosso atendimento?',
						required: true,
						order: 1,
					},
					{
						id: '2',
						type: 'long-text',
						title: 'Deixe seus comentários',
						required: false,
						order: 2,
					},
				],
			},
			{
				id: '2',
				title: 'Cadastro de Newsletter',
				description: 'Receba nossas atualizações',
				createdAt: '2024-01-10T14:30:00Z',
				updatedAt: '2024-01-10T14:30:00Z',
				userId: '1',
				isPublished: false,
				responseCount: 5,
				questions: [
					{
						id: '3',
						type: 'short-text',
						title: 'Qual seu nome?',
						required: true,
						order: 1,
					},
					{
						id: '4',
						type: 'email',
						title: 'Seu melhor e-mail',
						required: true,
						order: 2,
					},
				],
			},
		];

		setState((prev) => ({
			...prev,
			user: mockUser,
			forms: mockForms,
			currentView: 'dashboard',
		}));
	}, []);

	return {
		state,
		setView,
		setUser,
		setCurrentForm,
		setForms,
		addForm,
		updateForm,
		deleteForm,
		addQuestion,
		updateQuestion,
		deleteQuestion,
		addResponse,
		setResponses,
		setLoading,
		initializeMockData,
	};
};
