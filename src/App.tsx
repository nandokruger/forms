import React from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { FormEditor } from './components/FormEditor';
import { FormView } from './components/FormView';
import { Results } from './components/Results';
import { useAppState } from './hooks/useAppState';
import {
	getAllForms,
	getPublishedForms,
	getFormById,
	saveForm,
	deleteFormFirestore,
	saveResponse,
	getResponsesByFormId,
} from './services/formService';
import { signIn, signUp, logout, onAuthStateChange } from './services/authService';
import { generateId } from './utils/helpers';
import { Form } from './types';
import { useEffect } from 'react';

function App() {
	const {
		state,
		setView,
		setUser,
		setCurrentForm,
		setForms,
		addForm,
		updateForm,
		deleteForm,
		addResponse,
		setResponses,
		setLoading,
		initializeMockData,
	} = useAppState();

	// Support direct access to /form/:id without requiring login
	useEffect(() => {
		const path = window.location.pathname;
		const match = path.match(/^\/form\/(.+)$/);

		if (match && match[1]) {
			const formId = match[1];
			(async () => {
				try {
					setLoading(true);
					const form = await getFormById(formId);
					if (form && form.isPublished) {
						setCurrentForm(form);
						setView('form-view');
					} else {
						setView('login');
						alert('Formulário não encontrado ou não publicado.');
					}
				} catch (e) {
					console.error('Erro ao carregar formulário público:', e);
					setView('login');
				} finally {
					setLoading(false);
				}
			})();
		} else {
			// Check Firebase auth state for regular pages
			const unsubscribe = onAuthStateChange(async (firebaseUser) => {
				if (firebaseUser) {
					const userData = {
						id: firebaseUser.uid,
						email: firebaseUser.email || 'unknown@example.com',
						name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
					};
					setUser(userData);
					setView('dashboard');
					try {
						setLoading(true);
						const forms = await getAllForms();
						setForms(forms);
					} catch (error) {
						console.error('Erro ao carregar formulários do Firestore:', error);
					} finally {
						setLoading(false);
					}
				} else {
					setUser(null);
					setView('login');
				}
			});
			return () => unsubscribe();
		}
	}, [setUser, setView, setCurrentForm, setForms, setLoading]);

	const handleLogin = async (
		email: string,
		password: string,
		name: string | undefined,
		isSignup: boolean
	) => {
		try {
			setLoading(true);
			let firebaseUser;
			if (isSignup) {
				firebaseUser = await signUp(email, password);
			} else {
				firebaseUser = await signIn(email, password);
			}

			if (firebaseUser) {
				const userData = {
					id: firebaseUser.uid,
					email: firebaseUser.email || 'unknown@example.com',
					name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuário',
				};
				setUser(userData);
				setView('dashboard');
				const forms = await getAllForms();
				setForms(forms);
			}
		} catch (error) {
			console.error('Erro na autenticação:', error);
			alert(`Erro: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		try {
			await logout();
			setUser(null);
			setForms([]);
			setCurrentForm(null);
			setView('login');
		} catch (error) {
			console.error('Erro ao fazer logout:', error);
			alert(`Erro ao fazer logout: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateForm = () => {
		const newForm: Form = {
			id: generateId(),
			title: 'Novo Formulário',
			description: '',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			userId: state.user!.id,
			isPublished: false,
			responseCount: 0,
			questions: [],
			// UI settings defaults
			hideFormTitle: false,
			hideQuestionNumber: false,
			hideProgressBar: false,
			design: {
				fontFamily: 'Inter, system-ui, sans-serif',
				titleColor: '#111827',
				questionColor: '#111827',
				buttonColor: '#2563eb',
				buttonTextColor: '#ffffff',
				welcomeSize: 'md',
				welcomeAlign: 'center',
				cornerRadius: 12,
				backgroundColor: '#f8fafc',
				backgroundImageUrl: '',
			},
		};

		// Do not add to the list yet; open editor as draft
		setCurrentForm(newForm);
		setView('form-editor');
	};

	const handleEditForm = (form: Form) => {
		setCurrentForm(form);
		setView('form-editor');
	};

	const handleViewResults = async (form: Form) => {
		setCurrentForm(form);
		setView('results');

		// Load responses from Firestore
		try {
			setLoading(true);
			const responses = await getResponsesByFormId(form.id);
			setResponses(responses);
			console.log('Responses loaded:', responses);
		} catch (error) {
			console.error('Erro ao carregar respostas:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteForm = async (formId: string) => {
		if (confirm('Tem certeza que deseja excluir este formulário?')) {
			deleteForm(formId);
			try {
				await deleteFormFirestore(formId);
			} catch (e) {
				console.error('Erro ao excluir formulário no Firestore:', e);
			}
		}
	};

	const handleDuplicateForm = (originalForm: Form) => {
		const duplicatedForm: Form = {
			...originalForm,
			id: generateId(),
			title: `${originalForm.title} (Cópia)`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isPublished: false,
			responseCount: 0,
			questions: originalForm.questions.map((q) => ({
				...q,
				id: generateId(),
			})),
		};

		addForm(duplicatedForm);
	};

	const handleShareForm = (form: Form) => {
		const url = `${window.location.origin}/form/${form.id}`;
		navigator.clipboard.writeText(url).then(() => {
			alert('Link copiado para a área de transferência!');
		});
	};

	const handlePreviewForm = () => {
		if (state.currentForm) {
			setView('form-view');
		}
	};

	const handleSubmitResponse = async (response: any) => {
		try {
			setLoading(true);
			await saveResponse(response);
			addResponse(response);
			alert('Resposta enviada com sucesso!');
		} catch (error) {
			console.error('Erro ao salvar resposta:', error);
			alert('Erro ao salvar resposta. Tente novamente.');
		} finally {
			setLoading(false);
		}
	};

	const handleNavigate = (view: string) => {
		switch (view) {
			case 'dashboard':
				setView('dashboard');
				setCurrentForm(null);
				break;
			case 'results':
				setView('results');
				break;
			case 'login':
				handleLogout();
				break;
			default:
				setView(view as any);
		}
	};

	// Render current view
	const renderCurrentView = () => {
		const search = typeof window !== 'undefined' ? window.location.search : '';
		const params = new URLSearchParams(search);
		const isEmbed = params.get('embed') === 'true' || params.get('hideHeaders') === 'true';

		switch (state.currentView) {
			case 'login':
			case 'signup':
				return <Login onLogin={handleLogin} />;

			case 'dashboard':
				return (
					<Dashboard
						forms={state.forms}
						onCreateForm={handleCreateForm}
						onEditForm={handleEditForm}
						onViewResults={handleViewResults}
						onDeleteForm={handleDeleteForm}
						onDuplicateForm={handleDuplicateForm}
						onShareForm={handleShareForm}
					/>
				);

			case 'form-editor':
				return state.currentForm ? (
					<FormEditor
						form={state.currentForm}
						onUpdateForm={updateForm}
						onSave={async () => {
							try {
								await saveForm(state.currentForm!);
								setView('dashboard');
								// reload forms list
								const forms = await getAllForms();
								setForms(forms);
								// ensure currentForm points to saved copy
								const saved = forms.find((f) => f.id === state.currentForm!.id);
								if (saved) setCurrentForm(saved);
							} catch (e) {
								console.error('Erro ao salvar formulário:', e);
								alert('Erro ao salvar formulário.');
							}
						}}
						onPreview={handlePreviewForm}
						onBack={() => setView('dashboard')}
					/>
				) : (
					<div>Formulário não encontrado</div>
				);

			case 'form-view':
				return state.currentForm ? (
					<FormView
						form={state.currentForm}
						onSubmit={handleSubmitResponse}
						onBack={!isEmbed ? () => setView('form-editor') : undefined}
					/>
				) : (
					<div />
				);

			case 'results':
				return (
					<Results
						form={state.currentForm}
						responses={state.responses}
						onBack={() => setView('dashboard')}
					/>
				);

			case 'splash':
				return <div />;

			default:
				return <div>Página não encontrada</div>;
		}
	};

	return (
		<Layout
			user={state.user}
			onNavigate={handleNavigate}
			currentView={state.currentView}
			isLoading={state.isLoading}
		>
			{renderCurrentView()}
		</Layout>
	);
}

export default App;
