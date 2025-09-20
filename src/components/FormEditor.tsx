import React, { Fragment, useState } from 'react';
import {
	Plus,
	Settings,
	Type,
	AlignLeft,
	CheckSquare,
	Mail,
	Hash,
	Calendar,
	Star,
	Trash2,
	ArrowUp,
	ArrowDown,
	Workflow,
	FileText,
	Share2,
	ChevronDown,
	ChevronUp,
	Folder,
	AlertTriangle,
	Layers,
	PlayCircle,
} from 'lucide-react';
import {
	Form,
	Question,
	QuestionType,
	FormWorkflow,
	FinalScreen,
	WelcomeScreen,
	EmbedConfig,
} from '../types';
import { Dialog, Menu, Switch, Transition } from '@headlessui/react';
import { createEmptyQuestion, getQuestionTypeLabel } from '../utils/helpers';
import { useToast } from './ToastProvider';
import { WorkflowBuilder } from './WorkflowBuilder';
import { ShareEmbed } from './ShareEmbed';
import { saveForm } from '../services/formService';
import DesignModal from './DesignModal';

interface FormEditorProps {
	form: Form;
	onUpdateForm: (form: Form) => void;
	onSave: () => void;
	onPreview: () => void;
	onBack: () => void;
}

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
	'short-text': <Type className='h-4 w-4' />,
	'long-text': <AlignLeft className='h-4 w-4' />,
	'multiple-choice': <CheckSquare className='h-4 w-4' />,
	email: <Mail className='h-4 w-4' />,
	number: <Hash className='h-4 w-4' />,
	date: <Calendar className='h-4 w-4' />,
	rating: <Star className='h-4 w-4' />,
	'question-group': <Folder className='h-4 w-4' />,
	multiquestion: <Layers className='h-4 w-4' />,
};

const QuestionTypeSelector = ({
	value,
	onChange,
	className,
	disabledTypes = [],
}: {
	value: QuestionType;
	onChange: (type: QuestionType) => void;
	className?: string;
	disabledTypes?: QuestionType[];
}) => {
	const allOptions: { value: QuestionType; label: string }[] = [
		{ value: 'short-text', label: 'Texto Curto' },
		{ value: 'long-text', label: 'Texto Longo' },
		{ value: 'multiple-choice', label: 'Múltipla Escolha' },
		{ value: 'email', label: 'E-mail' },
		{ value: 'number', label: 'Número' },
		{ value: 'date', label: 'Data' },
		{ value: 'rating', label: 'Avaliação' },
		{ value: 'question-group', label: 'Grupo de Perguntas' },
		{ value: 'multiquestion', label: 'Múltiplas Perguntas' },
	];

	const options = allOptions.filter((opt) => !disabledTypes.includes(opt.value));
	const selectedOption = allOptions.find((opt) => opt.value === value);

	return (
		<div className='relative'>
			<details className='group'>
				<summary
					className={`list-none w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between ${className}`}
				>
					<span className='flex items-center'>
						{selectedOption && questionTypeIcons[selectedOption.value]}
						<span className='ml-2'>{selectedOption ? selectedOption.label : 'Selecione...'}</span>
					</span>
					<ChevronDown className='h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform' />
				</summary>
				<div className='absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden'>
					{options.map((option) => (
						<button
							key={option.value}
							onClick={(e) => {
								onChange(option.value);
								const details = (e.currentTarget as HTMLElement).closest('details');
								if (details) details.open = false;
							}}
							className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
						>
							{questionTypeIcons[option.value]}
							<span className='ml-2'>{option.label}</span>
						</button>
					))}
				</div>
			</details>
		</div>
	);
};

export const FormEditor: React.FC<FormEditorProps> = ({
	form,
	onUpdateForm,
	onSave,
	onPreview,
	onBack,
}) => {
	const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
		form.questions[0]?.id || null
	);
	const [selectedGroupQuestionId, setSelectedGroupQuestionId] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'content' | 'workflow' | 'settings' | 'share'>(
		'content'
	);
	const [showDesign, setShowDesign] = useState(false);
	const [isWelcomeScreenSelected, setIsWelcomeScreenSelected] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedFinalId, setSelectedFinalId] = useState<string | null>(null);
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
		() =>
			new Set(
				form.questions
					.filter((q) => q.type === 'question-group' || q.type === 'multiquestion')
					.map((q) => q.id)
			)
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<{
		type: 'question' | 'group-question' | 'welcome' | 'final';
		id: string;
		groupId?: string;
		title?: string;
	} | null>(null);

	const { showToast } = useToast();

	const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId);
	const welcomeScreen = form.welcomeScreen;
	const finals = form.finals || [];
	const selectedFinal = finals.find((f) => f.id === selectedFinalId) || null;

	// Find selected group question if we're in a group
	const selectedGroupQuestion =
		(selectedQuestion?.type === 'question-group' || selectedQuestion?.type === 'multiquestion') &&
		selectedGroupQuestionId
			? selectedQuestion.questions?.find((q) => q.id === selectedGroupQuestionId)
			: null;

	const addQuestion = () => {
		const newQuestion = createEmptyQuestion(form.questions.length + 1);
		const updatedForm = {
			...form,
			questions: [...form.questions, newQuestion],
		};
		onUpdateForm(updatedForm);
		setIsWelcomeScreenSelected(false);
		setSelectedFinalId(null);
		setSelectedQuestionId(newQuestion.id);
	};

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave(); // Notifica o componente pai para salvar
			showToast('Formulário salvo com sucesso!', 'success');
		} catch (err) {
			showToast('Erro ao salvar o formulário.', 'error');
			console.error('Save error:', err);
		} finally {
			setIsSaving(false);
		}
	};

	const toggleGroupExpansion = (groupId: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupId)) {
				newSet.delete(groupId);
			} else {
				newSet.add(groupId);
			}
			return newSet;
		});
	};

	const addQuestionGroup = () => {
		const newGroup: Question = {
			id: `${Date.now()}`,
			type: 'question-group',
			title: 'Novo Grupo de Perguntas',
			description: '',
			required: false,
			order: form.questions.length + 1,
			questions: [],
		};
		const updatedForm = {
			...form,
			questions: [...form.questions, newGroup],
		};
		onUpdateForm(updatedForm);
		setIsWelcomeScreenSelected(false);
		setSelectedFinalId(null);
		setSelectedQuestionId(newGroup.id);
		setExpandedGroups((prev) => new Set(prev).add(newGroup.id));
	};

	const addMultiQuestion = () => {
		const newMultiQuestion: Question = {
			id: `${Date.now()}`,
			type: 'multiquestion',
			title: 'Novas Múltiplas Perguntas',
			description: '',
			required: false,
			order: form.questions.length + 1,
			questions: [],
		};
		const updatedForm = {
			...form,
			questions: [...form.questions, newMultiQuestion],
		};
		onUpdateForm(updatedForm);
		setIsWelcomeScreenSelected(false);
		setSelectedFinalId(null);
		setSelectedQuestionId(newMultiQuestion.id);
		setExpandedGroups((prev) => new Set(prev).add(newMultiQuestion.id));
	};

	const addWelcomeScreen = () => {
		if (form.welcomeScreen) return;
		const newWelcomeScreen: WelcomeScreen = {
			id: 'welcome-screen',
			title: 'Bem-vindo(a)!',
			description: 'Clique no botão para começar.',
			buttonText: 'Começar',
			showButton: true,
		};
		onUpdateForm({ ...form, welcomeScreen: newWelcomeScreen });
		setIsWelcomeScreenSelected(true);
		setSelectedQuestionId(null);
		setSelectedFinalId(null);
	};

	const updateWelcomeScreen = (updates: Partial<WelcomeScreen>) => {
		if (!form.welcomeScreen) return;
		onUpdateForm({
			...form,
			welcomeScreen: { ...form.welcomeScreen, ...updates },
		});
	};

	const deleteWelcomeScreen = () => {
		const newForm = { ...form };
		delete newForm.welcomeScreen;
		onUpdateForm(newForm);
		setIsWelcomeScreenSelected(false);
	};

	const addFinal = () => {
		const newFinal: FinalScreen = {
			id: `${Date.now()}`,
			title: '',
			description: '',
			buttonText: 'Voltar ao início',
			showButton: true,
		};
		onUpdateForm({ ...form, finals: [...finals, newFinal] });
		setIsWelcomeScreenSelected(false);
		setSelectedQuestionId(null);
		setSelectedFinalId(newFinal.id);
	};

	const updateFinal = (finalId: string, updates: Partial<FinalScreen>) => {
		onUpdateForm({
			...form,
			finals: finals.map((f) => (f.id === finalId ? { ...f, ...updates } : f)),
		});
	};

	const deleteFinal = (finalId: string) => {
		onUpdateForm({ ...form, finals: finals.filter((f) => f.id !== finalId) });
		if (selectedFinalId === finalId) {
			const remaining = finals.filter((f) => f.id !== finalId);
			setSelectedFinalId(remaining.length ? remaining[0].id : null);
		}
	};

	const moveFinal = (finalId: string, direction: 'up' | 'down') => {
		const list = [...finals];
		const index = list.findIndex((f) => f.id === finalId);
		if (index < 0) return;
		if (direction === 'up' && index > 0) {
			[list[index], list[index - 1]] = [list[index - 1], list[index]];
		} else if (direction === 'down' && index < list.length - 1) {
			[list[index], list[index + 1]] = [list[index + 1], list[index]];
		}
		onUpdateForm({ ...form, finals: list });
	};

	const getFinalCardTitle = (index: number, f: FinalScreen) => {
		const letter = String.fromCharCode(65 + index);
		return `Final ${letter}`;
	};

	const updateQuestion = (questionId: string, updates: Partial<Question>) => {
		const updatedForm = {
			...form,
			questions: form.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
		};
		onUpdateForm(updatedForm);
	};

	const deleteQuestion = (questionId: string) => {
		const updatedForm = {
			...form,
			questions: form.questions.filter((q) => q.id !== questionId),
		};
		onUpdateForm(updatedForm);

		if (selectedQuestionId === questionId) {
			const remaining = updatedForm.questions;
			setSelectedQuestionId(remaining.length > 0 ? remaining[0].id : null);
		}
	};

	const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
		const questions = [...form.questions];
		const index = questions.findIndex((q) => q.id === questionId);

		if (direction === 'up' && index > 0) {
			[questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
		} else if (direction === 'down' && index < questions.length - 1) {
			[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
		}

		// Update order
		questions.forEach((q, i) => {
			q.order = i + 1;
		});

		const updatedForm = { ...form, questions };
		onUpdateForm(updatedForm);
	};

	const updateFormDetails = (updates: Partial<Form>) => {
		onUpdateForm({ ...form, ...updates });
	};

	// Functions for managing questions within groups
	const addQuestionToGroup = (groupId: string) => {
		const group = form.questions.find((q) => q.id === groupId);
		if (!group || (group.type !== 'question-group' && group.type !== 'multiquestion')) return;

		const newQuestion = createEmptyQuestion((group.questions || []).length + 1);
		const updatedGroup = {
			...group,
			questions: [...(group.questions || []), newQuestion],
		};

		const updatedForm = {
			...form,
			questions: form.questions.map((q) => (q.id === groupId ? updatedGroup : q)),
		};
		onUpdateForm(updatedForm);
	};

	const updateQuestionInGroup = (
		groupId: string,
		questionId: string,
		updates: Partial<Question>
	) => {
		const group = form.questions.find((q) => q.id === groupId);
		if (!group || (group.type !== 'question-group' && group.type !== 'multiquestion')) return;

		const updatedGroup = {
			...group,
			questions: (group.questions || []).map((q) =>
				q.id === questionId ? { ...q, ...updates } : q
			),
		};

		const updatedForm = {
			...form,
			questions: form.questions.map((q) => (q.id === groupId ? updatedGroup : q)),
		};
		onUpdateForm(updatedForm);
	};

	const deleteQuestionFromGroup = (groupId: string, questionId: string) => {
		const group = form.questions.find((q) => q.id === groupId);
		if (!group || (group.type !== 'question-group' && group.type !== 'multiquestion')) return;

		const updatedGroup = {
			...group,
			questions: (group.questions || []).filter((q) => q.id !== questionId),
		};

		const updatedForm = {
			...form,
			questions: form.questions.map((q) => (q.id === groupId ? updatedGroup : q)),
		};
		onUpdateForm(updatedForm);
	};

	const moveQuestionInGroup = (groupId: string, questionId: string, direction: 'up' | 'down') => {
		const group = form.questions.find((q) => q.id === groupId);
		if (!group || (group.type !== 'question-group' && group.type !== 'multiquestion')) return;

		const questions = [...(group.questions || [])];
		const index = questions.findIndex((q) => q.id === questionId);

		if (direction === 'up' && index > 0) {
			[questions[index], questions[index - 1]] = [questions[index - 1], questions[index]];
		} else if (direction === 'down' && index < questions.length - 1) {
			[questions[index], questions[index + 1]] = [questions[index + 1], questions[index]];
		}

		// Update order
		questions.forEach((q, i) => {
			q.order = i + 1;
		});

		const updatedGroup = { ...group, questions };
		const updatedForm = {
			...form,
			questions: form.questions.map((q) => (q.id === groupId ? updatedGroup : q)),
		};
		onUpdateForm(updatedForm);
	};

	const handleDeleteConfirm = () => {
		if (!itemToDelete) return;

		switch (itemToDelete.type) {
			case 'question':
				deleteQuestion(itemToDelete.id);
				break;
			case 'group-question':
				if (itemToDelete.groupId) {
					deleteQuestionFromGroup(itemToDelete.groupId, itemToDelete.id);
				}
				break;
			case 'welcome':
				deleteWelcomeScreen();
				break;
			case 'final':
				deleteFinal(itemToDelete.id);
				break;
		}
		setIsDeleteDialogOpen(false);
		setItemToDelete(null);
	};

	return (
		<div className='h-screen bg-gray-50 flex'>
			{/* Left Sidebar - Questions List */}
			<div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
				<div className='px-6 pt-4 pb-0 border-b border-gray-200'>
					<div className='relative'>
						<Menu as='div' className='relative'>
							<Menu.Button className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between ui-open:ring-2 ui-open:ring-blue-500 ui-open:border-blue-500'>
								<span className='flex items-center'>
									{activeTab === 'content' && <FileText className='h-4 w-4 mr-2' />}
									{activeTab === 'workflow' && <Workflow className='h-4 w-4 mr-2' />}
									{activeTab === 'settings' && <Settings className='h-4 w-4 mr-2' />}
									{activeTab === 'share' && <Share2 className='h-4 w-4 mr-2' />}
									{activeTab === 'content' && 'Conteúdo'}
									{activeTab === 'workflow' && 'Workflow'}
									{activeTab === 'settings' && 'Configurações'}
									{activeTab === 'share' && 'Share'}
								</span>
								<ChevronDown className='h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform' />
							</Menu.Button>
							<Transition
								as={Fragment}
								enter='transition ease-out duration-100'
								enterFrom='transform opacity-0 scale-95'
								enterTo='transform opacity-100 scale-100'
								leave='transition ease-in duration-75'
								leaveFrom='transform opacity-100 scale-100'
								leaveTo='transform opacity-0 scale-95'
							>
								<Menu.Items className='absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
									<div className='py-1'>
										<Menu.Item>
											{({ active }) => (
												<button
													onClick={() => setActiveTab('content')}
													className={`${
														active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
													} group flex w-full items-center px-3 py-2 text-left text-sm`}
												>
													<FileText className='h-4 w-4 mr-2 text-gray-600' /> Conteúdo
												</button>
											)}
										</Menu.Item>
										<Menu.Item>
											{({ active }) => (
												<button
													onClick={() => setActiveTab('workflow')}
													className={`${
														active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
													} group flex w-full items-center px-3 py-2 text-left text-sm`}
												>
													<Workflow className='h-4 w-4 mr-2 text-gray-600' /> Workflow
												</button>
											)}
										</Menu.Item>
										<Menu.Item>
											{({ active }) => (
												<button
													onClick={() => setActiveTab('settings')}
													className={`${
														active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
													} group flex w-full items-center px-3 py-2 text-left text-sm`}
												>
													<Settings className='h-4 w-4 mr-2 text-gray-600' /> Configurações
												</button>
											)}
										</Menu.Item>
										<Menu.Item>
											{({ active }) => (
												<button
													onClick={() => setActiveTab('share')}
													className={`${
														active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
													} group flex w-full items-center px-3 py-2 text-left text-sm`}
												>
													<Share2 className='h-4 w-4 mr-2 text-gray-600' /> Share
												</button>
											)}
										</Menu.Item>
									</div>
								</Menu.Items>
							</Transition>
						</Menu>
					</div>
					{/* Top Header */}
					<div className='flex items-center space-x-4 mb-1 mt-5 justify-between'>
						<h2 className='text-lg font-semibold text-gray-900'>Perguntas</h2>
						<div className='relative'>
							<Menu as='div' className='relative inline-block text-left'>
								<Menu.Button className='flex items-center space-x-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer ui-open:ring-2 ui-open:ring-blue-500 ui-open:border-blue-500'>
									<span className='flex items-center'>
										<Plus className='h-3 w-3 mr-2 text-gray-600' />
										Add conteúdo
									</span>
									<ChevronDown className='h-4 w-4 text-gray-500 ui-open:rotate-180 transition-transform' />
								</Menu.Button>
								<Transition
									as={Fragment}
									enter='transition ease-out duration-100'
									enterFrom='transform opacity-0 scale-95'
									enterTo='transform opacity-100 scale-100'
									leave='transition ease-in duration-75'
									leaveFrom='transform opacity-100 scale-100'
									leaveTo='transform opacity-0 scale-95'
								>
									<Menu.Items className='absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
										<div className='py-1'>
											<Menu.Item disabled={!!form.welcomeScreen}>
												{({ active, disabled }) => (
													<button
														onClick={addWelcomeScreen}
														className={`${
															active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
														} group flex w-full items-center px-3 py-2 text-sm ${
															disabled ? 'opacity-50 cursor-not-allowed' : ''
														}`}
														disabled={disabled}
													>
														<PlayCircle className='h-4 w-4 mr-2 text-orange-600' /> Tela de Início
													</button>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<button
														onClick={addQuestion}
														className={`${
															active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
														} group flex w-full items-center px-3 py-2 text-sm`}
													>
														<Plus className='h-4 w-4 mr-2 text-blue-600' /> Adicionar pergunta
													</button>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<button
														onClick={addQuestionGroup}
														className={`${
															active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
														} group flex w-full items-center px-3 py-2 text-sm`}
													>
														<Folder className='h-4 w-4 mr-2 text-green-600' /> Adicionar grupo
													</button>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<button
														onClick={addMultiQuestion}
														className={`${
															active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
														} group flex w-full items-center px-3 py-2 text-sm`}
													>
														<Layers className='h-4 w-4 mr-2 text-purple-600' /> Adicionar múltiplas
													</button>
												)}
											</Menu.Item>
										</div>
									</Menu.Items>
								</Transition>
							</Menu>
						</div>
					</div>
				</div>

				<div className='flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300'>
					{/* Welcome Screen Section */}
					{form.welcomeScreen && (
						<div className='mb-4'>
							<h3 className='text-sm font-semibold text-gray-900 mb-2'>Início</h3>
							<div
								className={`p-3 rounded-lg border transition-all cursor-pointer ${
									isWelcomeScreenSelected
										? 'bg-blue-50 border-blue-200'
										: 'bg-white border-gray-200 hover:border-gray-300'
								}`}
								onClick={() => {
									setIsWelcomeScreenSelected(true);
									setSelectedQuestionId(null);
									setSelectedFinalId(null);
								}}
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center space-x-2 flex-1 min-w-0'>
										<PlayCircle className='h-4 w-4 text-orange-600' />
										<span className='text-sm font-medium text-gray-900 truncate'>
											Tela de Início
										</span>
									</div>
									<div className='flex items-center space-x-1'>
										<button
											onClick={(e) => {
												e.stopPropagation();
												setItemToDelete({
													type: 'welcome',
													id: 'welcome-screen',
												});
												setIsDeleteDialogOpen(true);
											}}
											className='p-1 text-red-400 hover:text-red-600'
										>
											<Trash2 className='h-3 w-3' />
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
					{form.questions.length === 0 ? (
						<div className='text-center py-8 text-gray-500'>
							<p className='text-sm'>Nenhuma pergunta ainda.</p>
							<p className='text-sm'>Clique no + para adicionar.</p>
						</div>
					) : (
						<div className='space-y-2'>
							{form.questions.map((question, index) => (
								<div key={question.id}>
									{/* Question Group or MultiQuestion */}
									{question.type === 'question-group' || question.type === 'multiquestion' ? (
										<div className='border border-gray-200 rounded-lg overflow-hidden'>
											{/* Group Header */}
											<div // prettier-ignore
												className={`p-3 bg-gray-50 border-b border-gray-200 transition-all ${
													selectedQuestionId === question.id &&
													!selectedFinalId &&
													!isWelcomeScreenSelected
														? 'bg-blue-50 border-blue-200'
														: 'hover:bg-gray-100'
												}`}
											>
												<div className='flex items-center justify-between'>
													<div
														className='flex items-center space-x-2 flex-1 min-w-0 cursor-pointer'
														onClick={() => {
															setIsWelcomeScreenSelected(false);
															setSelectedFinalId(null);
															setSelectedQuestionId(question.id);
															setSelectedGroupQuestionId(null);
														}}
													>
														{questionTypeIcons[question.type]}
														<span className='text-sm font-medium text-gray-900 truncate'>
															{question.title}
														</span>
													</div>
													<div className='flex items-center space-x-1'>
														<button
															onClick={(e) => {
																e.stopPropagation();
																toggleGroupExpansion(question.id);
															}}
															className='p-1 text-gray-400 hover:text-gray-600 transition-colors'
														>
															{expandedGroups.has(question.id) ? (
																<ChevronUp className='h-4 w-4' />
															) : (
																<ChevronDown className='h-4 w-4' />
															)}
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																moveQuestion(question.id, 'up');
															}}
															disabled={index === 0}
															className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
														>
															<ArrowUp className='h-3 w-3' />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																moveQuestion(question.id, 'down');
															}}
															disabled={index === form.questions.length - 1}
															className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
														>
															<ArrowDown className='h-3 w-3' />
														</button>
														<button
															onClick={(e) => {
																e.stopPropagation();
																setItemToDelete({
																	type: 'question',
																	id: question.id,
																});
																setIsDeleteDialogOpen(true);
															}}
															className='p-1 text-red-400 hover:text-red-600'
														>
															<Trash2 className='h-3 w-3' />
														</button>
													</div>
												</div>
												<div className='mt-1 text-xs text-gray-500'>
													{getQuestionTypeLabel(question.type)}
												</div>
											</div>

											{/* Group Questions */}
											{expandedGroups.has(question.id) && (
												<div className='bg-white'>
													{(question.questions || []).map((groupQuestion, groupIndex) => (
														<div
															key={groupQuestion.id}
															className={`p-2 pl-6 border-l-2 border-gray-100 hover:border-gray-200 transition-all cursor-pointer ${
																// prettier-ignore
																selectedQuestionId === question.id &&
																selectedGroupQuestionId === groupQuestion.id &&
																!selectedFinalId &&
																!isWelcomeScreenSelected
																	? 'border-blue-200 bg-blue-50'
																	: 'hover:bg-gray-50'
															}`}
															onClick={() => {
																setIsWelcomeScreenSelected(false);
																setSelectedFinalId(null);
																setSelectedQuestionId(question.id);
																setSelectedGroupQuestionId(groupQuestion.id);
															}}
														>
															<div className='flex items-center justify-between'>
																<div className='flex items-center space-x-2 flex-1 min-w-0'>
																	{questionTypeIcons[groupQuestion.type]}
																	<span className='text-xs font-medium text-gray-700 truncate'>
																		{groupQuestion.title || 'Pergunta sem título'}
																	</span>
																</div>
																<div className='flex items-center space-x-1'>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			moveQuestionInGroup(question.id, groupQuestion.id, 'up');
																		}}
																		disabled={groupIndex === 0}
																		className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																	>
																		<ArrowUp className='h-3 w-3' />
																	</button>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			moveQuestionInGroup(question.id, groupQuestion.id, 'down');
																		}}
																		disabled={groupIndex === (question.questions || []).length - 1}
																		className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																	>
																		<ArrowDown className='h-3 w-3' />
																	</button>
																	<button
																		onClick={(e) => {
																			e.stopPropagation();
																			setItemToDelete({
																				type: 'group-question',
																				id: groupQuestion.id,
																				groupId: question.id,
																			});
																			setIsDeleteDialogOpen(true);
																		}}
																		className='p-1 text-red-400 hover:text-red-600'
																	>
																		<Trash2 className='h-3 w-3' />
																	</button>
																</div>
															</div>
															<div className='mt-1 text-xs text-gray-500'>
																{getQuestionTypeLabel(groupQuestion.type)}
															</div>
														</div>
													))}

													{/* Add Question Button */}
													<div className='p-2 pl-6 border-l-2 border-gray-100'>
														<button
															onClick={(e) => {
																e.stopPropagation();
																addQuestionToGroup(question.id);
																setSelectedGroupQuestionId(null);
															}}
															className='flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors'
														>
															<Plus className='h-3 w-3' />
															<span>Adicionar pergunta</span>
														</button>
													</div>
												</div>
											)}
										</div>
									) : (
										/* Regular Question */
										<div
											className={`p-3 rounded-lg border transition-all cursor-pointer ${
												// prettier-ignore
												selectedQuestionId === question.id &&
												!selectedFinalId &&
												!isWelcomeScreenSelected
													? 'bg-blue-50 border-blue-200'
													: 'bg-white border-gray-200 hover:border-gray-300'
											}`}
											onClick={() => {
												setIsWelcomeScreenSelected(false);
												setSelectedFinalId(null);
												setSelectedQuestionId(question.id);
											}}
										>
											<div className='flex items-center justify-between'>
												<div className='flex items-center space-x-2 flex-1 min-w-0'>
													{questionTypeIcons[question.type]}
													<span className='text-sm font-medium text-gray-900 truncate'>
														{question.title}
													</span>
												</div>
												<div className='flex items-center space-x-1'>
													<button
														onClick={(e) => {
															e.stopPropagation();
															moveQuestion(question.id, 'up');
														}}
														disabled={index === 0}
														className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
													>
														<ArrowUp className='h-3 w-3' />
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															moveQuestion(question.id, 'down');
														}}
														disabled={index === form.questions.length - 1}
														className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
													>
														<ArrowDown className='h-3 w-3' />
													</button>
													<button
														onClick={(e) => {
															e.stopPropagation();
															setItemToDelete({
																type: 'question',
																id: question.id,
															});
															setIsDeleteDialogOpen(true);
														}}
														className='p-1 text-red-400 hover:text-red-600'
													>
														<Trash2 className='h-3 w-3' />
													</button>
												</div>
											</div>
											<div className='mt-1 text-xs text-gray-500'>
												{getQuestionTypeLabel(question.type)}
											</div>
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Finals Section */}
					<div className='mt-6 border-t pt-4'>
						<div className='flex items-center justify-between mb-2'>
							<h3 className='text-sm font-semibold text-gray-900'>Finais</h3>
							<button
								onClick={addFinal}
								className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
								title='Adicionar final'
							>
								<Plus className='h-4 w-4' />
							</button>
						</div>
						{finals.length === 0 ? (
							<p className='text-xs text-gray-500'>
								Nenhuma tela final. Clique no + para adicionar.
							</p>
						) : (
							<div className='space-y-2'>
								{finals.map((f, index) => (
									<div
										key={f.id}
										className={`p-3 rounded-lg border transition-all cursor-pointer ${
											// prettier-ignore
											selectedFinalId === f.id &&
											!selectedQuestionId &&
											!isWelcomeScreenSelected
												? 'bg-blue-50 border-blue-200'
												: 'bg-white border-gray-200 hover:border-gray-300'
										}`}
										onClick={() => {
											setIsWelcomeScreenSelected(false);
											setSelectedQuestionId(null);
											setSelectedFinalId(f.id);
										}}
									>
										<div className='flex items-center justify-between'>
											<div className='flex items-center space-x-2 flex-1 min-w-0'>
												<FileText className='h-4 w-4 text-gray-600' />
												<span className='text-sm font-medium text-gray-900 truncate'>
													{getFinalCardTitle(index, f)}
												</span>
											</div>
											<div className='flex items-center space-x-1'>
												<button
													onClick={(e) => {
														e.stopPropagation();
														moveFinal(f.id, 'up');
													}}
													disabled={index === 0}
													className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
												>
													<ArrowUp className='h-3 w-3' />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														moveFinal(f.id, 'down');
													}}
													disabled={index === finals.length - 1}
													className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
												>
													<ArrowDown className='h-3 w-3' />
												</button>
												<button
													onClick={(e) => {
														e.stopPropagation();
														setItemToDelete({
															type: 'final',
															id: f.id,
														});
														setIsDeleteDialogOpen(true);
													}}
													className='p-1 text-red-400 hover:text-red-600'
												>
													<Trash2 className='h-3 w-3' />
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className='flex-1 flex flex-col'>
				{/* Top Header */}
				<div className='bg-white border-b border-gray-200 px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-4'>
							<button onClick={onBack} className='text-sm text-gray-400 hover:text-gray-600'>
								← Voltar
							</button>
							<div className='flex items-center space-x-2'>
								<FileText className='h-5 w-5 text-gray-500' />
								<h1 className='text-xl font-semibold text-gray-900'>{form.title}</h1>
							</div>
						</div>
						<div className='flex items-center space-x-3'>
							<button
								onClick={onPreview}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
							>
								Visualizar
							</button>
							<button
								onClick={handleSave}
								disabled={isSaving}
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
							>
								{isSaving ? 'Salvando...' : 'Salvar'}
							</button>
						</div>
					</div>
				</div>

				{/* Editor Content */}
				<div className='flex-1'>
					{activeTab === 'content' ? (
						isWelcomeScreenSelected && welcomeScreen ? (
							<div className='max-w-2xl mx-auto p-6'>
								<div className='mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-2'>
										<PlayCircle className='h-4 w-4 text-gray-600' />
										<span className='text-sm font-medium text-gray-700'>{welcomeScreen.title}</span>
									</div>
								</div>
								<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
									<div className='space-y-6'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Título da tela de início
											</label>
											<input
												type='text'
												value={welcomeScreen.title}
												onChange={(e) => updateWelcomeScreen({ title: e.target.value })}
												className='shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Título da tela de início'
											/>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Descrição
											</label>
											<textarea
												value={welcomeScreen.description || ''}
												onChange={(e) => updateWelcomeScreen({ description: e.target.value })}
												rows={3}
												className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Mensagem de boas-vindas...'
											/>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-end'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Texto do botão
												</label>
												<input
													type='text'
													value={welcomeScreen.buttonText || ''}
													onChange={(e) => updateWelcomeScreen({ buttonText: e.target.value })}
													className='w-fullshadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Ex: Começar'
												/>
											</div>
											<div className='flex items-center justify-between'>
												<span className='text-sm text-gray-700 mr-2'>Mostrar botão</span>
												<button
													onClick={() =>
														updateWelcomeScreen({ showButton: !welcomeScreen.showButton })
													}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
														welcomeScreen.showButton ? 'bg-blue-600' : 'bg-gray-200'
													}`}
													type='button'
													aria-pressed={!!welcomeScreen.showButton}
												>
													<span
														className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
															welcomeScreen.showButton ? 'translate-x-5' : 'translate-x-1'
														}`}
													/>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						) : selectedQuestion &&
						  ['question-group', 'multiquestion'].includes(selectedQuestion.type) ? (
							selectedGroupQuestion ? (
								/* Group Question Editor */
								<div className='max-w-2xl mx-auto p-6'>
									<div className='mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200'>
										<div className='flex items-center space-x-2'>
											{questionTypeIcons[selectedGroupQuestion.type]}
											<span className='text-sm font-medium text-gray-700'>
												{selectedGroupQuestion.title || 'Pergunta sem título'}
											</span>
										</div>
									</div>
									<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
										<div className='mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
											<div className='flex items-center space-x-2 mb-2'>
												{selectedQuestion.type === 'multiquestion' ? (
													<Layers className='h-4 w-4 text-gray-600' />
												) : (
													<Folder className='h-4 w-4 text-gray-600' />
												)}
												<span className='text-sm font-medium text-gray-700'>
													{selectedQuestion.type === 'multiquestion'
														? 'Múltiplas Perguntas'
														: 'Grupo'}
													: {selectedQuestion.title}
												</span>
											</div>
											<div className='text-xs text-gray-500'>Editando pergunta dentro do grupo</div>
										</div>

										<div className='space-y-6'>
											{/* Question Title */}
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Pergunta *
												</label>
												<input
													type='text'
													value={selectedGroupQuestion.title}
													onChange={(e) =>
														updateQuestionInGroup(selectedQuestion.id, selectedGroupQuestion.id, {
															title: e.target.value,
														})
													}
													className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Digite sua pergunta...'
												/>
											</div>

											{/* Question Description */}
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Descrição (opcional)
												</label>
												<textarea
													value={selectedGroupQuestion.description || ''}
													onChange={(e) =>
														updateQuestionInGroup(selectedQuestion.id, selectedGroupQuestion.id, {
															description: e.target.value,
														})
													}
													rows={2}
													className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Adicione uma descrição...'
												/>
											</div>

											{/* Question Type Selector */}
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Tipo de pergunta
												</label>
												<QuestionTypeSelector
													value={selectedGroupQuestion.type}
													onChange={(type) =>
														updateQuestionInGroup(selectedQuestion.id, selectedGroupQuestion.id, {
															type,
														})
													}
													disabledTypes={['question-group', 'multiquestion']}
												/>
											</div>

											{/* Multiple Choice Options */}
											{selectedGroupQuestion.type === 'multiple-choice' && (
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Opções
													</label>
													<div className='space-y-2'>
														{(selectedGroupQuestion.options || []).map((option, index) => (
															<div key={index} className='flex items-center space-x-2'>
																<input
																	type='text'
																	value={option}
																	onChange={(e) => {
																		const newOptions = [...(selectedGroupQuestion.options || [])];
																		newOptions[index] = e.target.value;
																		updateQuestionInGroup(
																			selectedQuestion.id,
																			selectedGroupQuestion.id,
																			{ options: newOptions }
																		);
																	}}
																	className='flex-1 shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
																	placeholder={`Opção ${index + 1}`}
																/>
																<button
																	onClick={() => {
																		const newOptions = (selectedGroupQuestion.options || []).filter(
																			(_, i) => i !== index
																		);
																		updateQuestionInGroup(
																			selectedQuestion.id,
																			selectedGroupQuestion.id,
																			{ options: newOptions }
																		);
																	}}
																	className='p-2 text-red-500 hover:text-red-700'
																>
																	<Trash2 className='h-4 w-4' />
																</button>
															</div>
														))}
														<button
															onClick={() => {
																const newOptions = [...(selectedGroupQuestion.options || []), ''];
																updateQuestionInGroup(
																	selectedQuestion.id,
																	selectedGroupQuestion.id,
																	{ options: newOptions }
																);
															}}
															className='text-sm text-blue-600 hover:text-blue-700'
														>
															+ Adicionar opção
														</button>
													</div>
												</div>
											)}

											{/* Required Toggle */}
											<div className='flex items-center'>
												<input
													type='checkbox'
													id='required'
													checked={selectedGroupQuestion.required}
													onChange={(e) =>
														updateQuestionInGroup(selectedQuestion.id, selectedGroupQuestion.id, {
															required: e.target.checked,
														})
													}
													className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
												/>
												<label htmlFor='required' className='ml-2 text-sm text-gray-700'>
													Resposta obrigatória
												</label>
											</div>
										</div>
									</div>
								</div>
							) : (
								/* Group Editor */
								<div className='max-w-2xl mx-auto p-6'>
									<div className='mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200'>
										<div className='flex items-center space-x-2'>
											{questionTypeIcons[selectedQuestion.type]}
											<span className='text-sm font-medium text-gray-700'>
												{selectedQuestion.title}
											</span>
										</div>
									</div>
									<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
										<div className='space-y-6'>
											{/* Group Title */}
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Título do Grupo *
												</label>
												<input
													type='text'
													value={selectedQuestion.title}
													onChange={(e) =>
														updateQuestion(selectedQuestion.id, {
															title: e.target.value,
														})
													}
													className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Digite o título do grupo...'
												/>
											</div>

											{/* Group Description */}
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Descrição do Grupo (opcional)
												</label>
												<textarea
													value={selectedQuestion.description || ''}
													onChange={(e) =>
														updateQuestion(selectedQuestion.id, {
															description: e.target.value,
														})
													}
													rows={2}
													className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Adicione uma descrição para o grupo...'
												/>
											</div>

											{/* Group Questions Management */}
											<div className='border-t pt-6'>
												<div className='flex items-center justify-between mb-4'>
													<h3 className='text-lg font-medium text-gray-900'>Perguntas do Grupo</h3>
													<button
														onClick={() => {
															addQuestionToGroup(selectedQuestion.id);
															setSelectedGroupQuestionId(null);
														}}
														className='px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'
													>
														<Plus className='h-4 w-4 mr-1 inline' />
														Adicionar Pergunta
													</button>
												</div>

												{(selectedQuestion.questions || []).length === 0 ? (
													<div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg'>
														<p className='text-sm'>Nenhuma pergunta no grupo ainda.</p>
														<p className='text-sm'>Clique em "Adicionar Pergunta" para começar.</p>
													</div>
												) : (
													<div className='space-y-3'>
														{(selectedQuestion.questions || []).map((question, index) => (
															<div
																key={question.id}
																className={`p-4 rounded-lg border transition-all cursor-pointer ${
																	selectedGroupQuestionId === question.id
																		? 'bg-blue-50 border-blue-200'
																		: 'bg-gray-50 border-gray-200 hover:border-gray-300'
																}`}
																onClick={() => setSelectedGroupQuestionId(question.id)}
															>
																<div className='flex items-center justify-between'>
																	<div className='flex items-center space-x-2 flex-1 min-w-0'>
																		{questionTypeIcons[question.type]}
																		<span className='text-sm font-medium text-gray-900 truncate'>
																			{question.title || 'Pergunta sem título'}
																		</span>
																	</div>
																	<div className='flex items-center space-x-1'>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				moveQuestionInGroup(selectedQuestion.id, question.id, 'up');
																			}}
																			disabled={index === 0}
																			className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																		>
																			<ArrowUp className='h-3 w-3' />
																		</button>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				moveQuestionInGroup(
																					selectedQuestion.id,
																					question.id,
																					'down'
																				);
																			}}
																			disabled={
																				index === (selectedQuestion.questions || []).length - 1
																			}
																			className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																		>
																			<ArrowDown className='h-3 w-3' />
																		</button>
																		<button
																			onClick={(e) => {
																				e.stopPropagation();
																				setItemToDelete({
																					type: 'group-question',
																					id: question.id,
																					groupId: selectedQuestion.id,
																				});
																				setIsDeleteDialogOpen(true);
																			}}
																			className='p-1 text-red-400 hover:text-red-600'
																		>
																			<Trash2 className='h-3 w-3' />
																		</button>
																	</div>
																</div>
																<div className='mt-1 text-xs text-gray-500'>
																	{getQuestionTypeLabel(question.type)}
																</div>
															</div>
														))}
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							)
						) : selectedQuestion ? (
							<div className='max-w-2xl mx-auto p-6'>
								<div className='mb-3 p-3 bg-gray-100 rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-2'>
										{questionTypeIcons[selectedQuestion.type]}
										<span className='text-sm font-medium text-gray-700'>
											{selectedQuestion.title}
										</span>
									</div>
								</div>
								<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
									<div className='space-y-6'>
										{/* Question Title */}
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Pergunta *
											</label>
											<input
												type='text'
												value={selectedQuestion.title}
												onChange={(e) =>
													updateQuestion(selectedQuestion.id, {
														title: e.target.value,
													})
												}
												className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Digite sua pergunta...'
											/>
										</div>

										{/* Question Description */}
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Descrição (opcional)
											</label>
											<textarea
												value={selectedQuestion.description || ''}
												onChange={(e) =>
													updateQuestion(selectedQuestion.id, {
														description: e.target.value,
													})
												}
												rows={2}
												className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Adicione uma descrição...'
											/>
										</div>

										{/* Question Type Selector */}
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Tipo de pergunta
											</label>
											<QuestionTypeSelector
												value={selectedQuestion.type}
												onChange={(type) =>
													updateQuestion(selectedQuestion.id, {
														type,
													})
												}
											/>
										</div>

										{/* Multiple Choice Options */}
										{selectedQuestion.type === 'multiple-choice' && (
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Opções
												</label>
												<div className='space-y-2'>
													{(selectedQuestion.options || []).map((option, index) => (
														<div key={index} className='flex items-center space-x-2'>
															<input
																type='text'
																value={option}
																onChange={(e) => {
																	const newOptions = [...(selectedQuestion.options || [])];
																	newOptions[index] = e.target.value;
																	updateQuestion(selectedQuestion.id, { options: newOptions });
																}}
																className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
																placeholder={`Opção ${index + 1}`}
															/>
															<button
																onClick={() => {
																	const newOptions = (selectedQuestion.options || []).filter(
																		(_, i) => i !== index
																	);
																	updateQuestion(selectedQuestion.id, { options: newOptions });
																}}
																className='p-2 text-red-500 hover:text-red-700'
															>
																<Trash2 className='h-4 w-4' />
															</button>
														</div>
													))}
													<button
														onClick={() => {
															const newOptions = [...(selectedQuestion.options || []), ''];
															updateQuestion(selectedQuestion.id, { options: newOptions });
														}}
														className='text-sm text-blue-600 hover:text-blue-700'
													>
														+ Adicionar opção
													</button>
												</div>
											</div>
										)}

										{/* Question Group or MultiQuestion Management */}
										{(selectedQuestion.type === 'question-group' ||
											selectedQuestion.type === 'multiquestion') && (
											<div className='space-y-4'>
												<div className='border-t pt-4'>
													<div className='flex items-center justify-between mb-4'>
														<h3 className='text-lg font-medium text-gray-900'>
															Perguntas do Grupo
														</h3>
														<button
															onClick={() => addQuestionToGroup(selectedQuestion.id)}
															className='px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'
														>
															<Plus className='h-4 w-4 mr-1 inline' />
															Adicionar Pergunta
														</button>
													</div>

													{(selectedQuestion.questions || []).length === 0 ? (
														<div className='text-center py-8 text-gray-500 bg-gray-50 rounded-lg'>
															<p className='text-sm'>Nenhuma pergunta no grupo ainda.</p>
															<p className='text-sm'>
																Clique em "Adicionar Pergunta" para começar.
															</p>
														</div>
													) : (
														<div className='space-y-3'>
															{(selectedQuestion.questions || []).map((question, index) => (
																<div
																	key={question.id}
																	className='p-4 bg-gray-50 rounded-lg border border-gray-200'
																>
																	<div className='flex items-center justify-between mb-2'>
																		<div className='flex items-center space-x-2 flex-1 min-w-0'>
																			{questionTypeIcons[question.type]}
																			<span className='text-sm font-medium text-gray-900 truncate'>
																				{question.title || 'Pergunta sem título'}
																			</span>
																		</div>
																		<div className='flex items-center space-x-1'>
																			<button
																				onClick={() =>
																					moveQuestionInGroup(
																						selectedQuestion.id,
																						question.id,
																						'up'
																					)
																				}
																				disabled={index === 0}
																				className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																			>
																				<ArrowUp className='h-3 w-3' />
																			</button>
																			<button
																				onClick={() =>
																					moveQuestionInGroup(
																						selectedQuestion.id,
																						question.id,
																						'down'
																					)
																				}
																				disabled={
																					index === (selectedQuestion.questions || []).length - 1
																				}
																				className='p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50'
																			>
																				<ArrowDown className='h-3 w-3' />
																			</button>
																			<button
																				onClick={() =>
																					deleteQuestionFromGroup(selectedQuestion.id, question.id)
																				}
																				className='p-1 text-red-400 hover:text-red-600'
																			>
																				<Trash2 className='h-3 w-3' />
																			</button>
																		</div>
																	</div>
																	<div className='text-xs text-gray-500 mb-2'>
																		{getQuestionTypeLabel(question.type)}
																	</div>
																	<div className='space-y-2'>
																		<input
																			type='text'
																			value={question.title}
																			onChange={(e) =>
																				updateQuestionInGroup(selectedQuestion.id, question.id, {
																					title: e.target.value,
																				})
																			}
																			className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
																			placeholder='Título da pergunta...'
																		/>
																		<textarea
																			value={question.description || ''}
																			onChange={(e) =>
																				updateQuestionInGroup(selectedQuestion.id, question.id, {
																					description: e.target.value,
																				})
																			}
																			rows={1}
																			className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
																			placeholder='Descrição (opcional)...'
																		/>
																		<select
																			value={question.type}
																			onChange={(e) =>
																				updateQuestionInGroup(selectedQuestion.id, question.id, {
																					type: e.target.value as QuestionType,
																				})
																			}
																			className='w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
																		>
																			<option value='short-text'>Texto Curto</option>
																			<option value='long-text'>Texto Longo</option>
																			<option value='multiple-choice'>Múltipla Escolha</option>
																			<option value='email'>E-mail</option>
																			<option value='number'>Número</option>
																			<option value='date'>Data</option>
																			<option value='rating'>Avaliação</option>
																		</select>
																		{question.type === 'multiple-choice' && (
																			<div className='space-y-1'>
																				{(question.options || []).map((option, optIndex) => (
																					<div
																						key={optIndex}
																						className='flex items-center space-x-2'
																					>
																						<input
																							type='text'
																							value={option}
																							onChange={(e) => {
																								const newOptions = [...(question.options || [])];
																								newOptions[optIndex] = e.target.value;
																								updateQuestionInGroup(
																									selectedQuestion.id,
																									question.id,
																									{
																										options: newOptions,
																									}
																								);
																							}}
																							className='flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
																							placeholder={`Opção ${optIndex + 1}`}
																						/>
																						<button
																							onClick={() => {
																								const newOptions = (question.options || []).filter(
																									(_, i) => i !== optIndex
																								);
																								updateQuestionInGroup(
																									selectedQuestion.id,
																									question.id,
																									{
																										options: newOptions,
																									}
																								);
																							}}
																							className='p-1 text-red-500 hover:text-red-700'
																						>
																							<Trash2 className='h-3 w-3' />
																						</button>
																					</div>
																				))}
																				<button
																					onClick={() => {
																						const newOptions = [...(question.options || []), ''];
																						updateQuestionInGroup(
																							selectedQuestion.id,
																							question.id,
																							{
																								options: newOptions,
																							}
																						);
																					}}
																					className='text-xs text-blue-600 hover:text-blue-700'
																				>
																					+ Adicionar opção
																				</button>
																			</div>
																		)}
																		<div className='flex items-center'>
																			<input
																				type='checkbox'
																				checked={question.required}
																				onChange={(e) =>
																					updateQuestionInGroup(selectedQuestion.id, question.id, {
																						required: e.target.checked,
																					})
																				}
																				className='h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
																			/>
																			<label className='ml-2 text-xs text-gray-700'>
																				Obrigatória
																			</label>
																		</div>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											</div>
										)}

										{/* Required Toggle - only show for non-group questions */}
										{selectedQuestion.type !== 'question-group' && (
											<Switch.Group as='div' className='flex items-center justify-between'>
												<Switch.Label as='span' className='text-sm text-gray-700' passive>
													Resposta obrigatória
												</Switch.Label>
												<Switch
													checked={selectedQuestion.required}
													onChange={(checked) =>
														updateQuestion(selectedQuestion.id, { required: checked })
													}
													className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
														selectedQuestion.required ? 'bg-blue-600' : 'bg-gray-200'
													}`}
												>
													<span
														className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
															selectedQuestion.required ? 'translate-x-5' : 'translate-x-1'
														}`}
													/>
												</Switch>
											</Switch.Group>
										)}
									</div>
								</div>
							</div>
						) : selectedFinal ? (
							<div className='max-w-2xl mx-auto p-6'>
								<div className='mb- p-3 bg-gray-100 rounded-lg border border-gray-200'>
									<div className='flex items-center space-x-2'>
										<FileText className='h-4 w-4 text-gray-600' />
										<span className='text-sm font-medium text-gray-700'>
											{selectedFinal.title ||
												getFinalCardTitle(
													finals.findIndex((f) => f.id === selectedFinalId),
													selectedFinal
												)}
										</span>
									</div>
								</div>
								<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
									<div className='space-y-6'>
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Título do final
											</label>
											<input
												type='text'
												value={selectedFinal.title}
												onChange={(e) => updateFinal(selectedFinal.id, { title: e.target.value })}
												className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Título da tela final'
											/>
										</div>

										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Descrição
											</label>
											<textarea
												value={selectedFinal.description || ''}
												onChange={(e) =>
													updateFinal(selectedFinal.id, { description: e.target.value })
												}
												rows={3}
												className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
												placeholder='Mensagem final...'
											/>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-end'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Texto do botão
												</label>
												<input
													type='text'
													value={selectedFinal.buttonText || ''}
													onChange={(e) =>
														updateFinal(selectedFinal.id, { buttonText: e.target.value })
													}
													className='w-full shadow-xs bg-gray-50 border border-gray-300 text-gray-900 text-md rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-xs-light'
													placeholder='Ex: Concluir'
												/>
											</div>
											<div className='flex items-center justify-between'>
												<span className='text-sm text-gray-700 mr-2'>Mostrar botão</span>
												<button
													onClick={() =>
														updateFinal(selectedFinal.id, { showButton: !selectedFinal.showButton })
													}
													className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
														selectedFinal.showButton ? 'bg-blue-600' : 'bg-gray-200'
													}`}
													type='button'
													aria-pressed={!!selectedFinal.showButton}
												>
													<span
														className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
															selectedFinal.showButton ? 'translate-x-5' : 'translate-x-1'
														}`}
													/>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className='text-center py-12'>
								<p className='text-gray-500'>Selecione um item à esquerda para editar.</p>
							</div>
						)
					) : activeTab === 'workflow' ? (
						/* Workflow Tab */
						<div className='max-w-6xl mx-auto'>
							<WorkflowBuilder
								questions={form.questions}
								finals={form.finals || []}
								workflow={form.workflow || { rules: [] }}
								onChange={(workflow: FormWorkflow) => updateFormDetails({ workflow })}
							/>
						</div>
					) : activeTab === 'share' ? (
						<div className=' mx-auto'>
							<ShareEmbed
								form={form}
								onBack={() => setActiveTab('content')}
								onUpdateEmbedConfig={(embedConfig) => onUpdateForm({ ...form, embedConfig })}
							/>
						</div>
					) : (
						/* Settings Tab */
						<div className='max-w-2xl mx-auto p-6'>
							<div className='bg-white rounded-lg shadow-sm border border-gray-200 p-8'>
								<div className='space-y-6'>
									<div>
										<h3 className='text-lg font-medium text-gray-900 mb-4'>
											Configurações do Formulário
										</h3>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Título do formulário *
										</label>
										<input
											type='text'
											value={form.title}
											onChange={(e) => updateFormDetails({ title: e.target.value })}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
											placeholder='Nome do seu formulário...'
										/>
									</div>

									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Descrição
										</label>
										<textarea
											value={form.description || ''}
											onChange={(e) => updateFormDetails({ description: e.target.value })}
											rows={3}
											className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
											placeholder='Descreva o objetivo do seu formulário...'
										/>
									</div>

									{/* Switches */}
									<div className='space-y-3'>
										<label className='flex items-center justify-between'>
											<span className='text-sm text-gray-700'>
												Formulário publicado (visível para respostas)
											</span>
											<button
												onClick={() => updateFormDetails({ isPublished: !form.isPublished })}
												className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													form.isPublished ? 'bg-blue-600' : 'bg-gray-200'
												}`}
												type='button'
												aria-pressed={form.isPublished}
											>
												<span
													className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
														form.isPublished ? 'translate-x-5' : 'translate-x-1'
													}`}
												/>
											</button>
										</label>

										<label className='flex items-center justify-between'>
											<span className='text-sm text-gray-700'>Ocultar nome do formulário</span>
											<button
												onClick={() => updateFormDetails({ hideFormTitle: !form.hideFormTitle })}
												className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													form.hideFormTitle ? 'bg-blue-600' : 'bg-gray-200'
												}`}
												type='button'
												aria-pressed={!!form.hideFormTitle}
											>
												<span
													className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
														form.hideFormTitle ? 'translate-x-5' : 'translate-x-1'
													}`}
												/>
											</button>
										</label>

										<label className='flex items-center justify-between'>
											<span className='text-sm text-gray-700'>Ocultar número da questão</span>
											<button
												onClick={() =>
													updateFormDetails({ hideQuestionNumber: !form.hideQuestionNumber })
												}
												className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													form.hideQuestionNumber ? 'bg-blue-600' : 'bg-gray-200'
												}`}
												type='button'
												aria-pressed={!!form.hideQuestionNumber}
											>
												<span
													className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
														form.hideQuestionNumber ? 'translate-x-5' : 'translate-x-1'
													}`}
												/>
											</button>
										</label>

										<label className='flex items-center justify-between'>
											<span className='text-sm text-gray-700'>Ocultar barra de progresso</span>
											<button
												onClick={() =>
													updateFormDetails({ hideProgressBar: !form.hideProgressBar })
												}
												className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													form.hideProgressBar ? 'bg-blue-600' : 'bg-gray-200'
												}`}
												type='button'
												aria-pressed={!!form.hideProgressBar}
											>
												<span
													className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
														form.hideProgressBar ? 'translate-x-5' : 'translate-x-1'
													}`}
												/>
											</button>
										</label>
									</div>
								</div>

								{/* Design button */}
								<div className='pt-4'>
									<button
										onClick={() => setShowDesign(true)}
										className='inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800'
									>
										<Settings className='h-4 w-4 mr-2' /> Design
									</button>
								</div>

								{/* Modal */}
								{showDesign && (
									<DesignModal
										form={form}
										onClose={() => setShowDesign(false)}
										onSave={async (design) => {
											const updated = { ...form, design };
											onUpdateForm(updated);
											try {
												await saveForm(updated);
											} catch (e) {
												console.error('Erro ao salvar design:', e);
											}
										}}
									/>
								)}
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Design modal removido temporariamente para corrigir parse */}

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={isDeleteDialogOpen}
				onClose={() => setIsDeleteDialogOpen(false)}
				className='relative z-50'
			>
				<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
				<div className='fixed inset-0 flex w-screen items-center justify-center p-4'>
					<Dialog.Panel className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
						<div className='flex items-start'>
							<div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
								<AlertTriangle className='h-6 w-6 text-red-600' aria-hidden='true' />
							</div>
							<div className='ml-4 text-left'>
								<Dialog.Title as='h3' className='text-lg font-medium leading-6 text-gray-900'>
									Excluir item
								</Dialog.Title>
								<div className='mt-2'>
									<p className='text-sm text-gray-500'>
										Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
									</p>
								</div>
							</div>
						</div>
						<div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
							<button
								type='button'
								className='inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm'
								onClick={handleDeleteConfirm}
							>
								Excluir
							</button>
							<button
								type='button'
								className='mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm'
								onClick={() => setIsDeleteDialogOpen(false)}
							>
								Cancelar
							</button>
						</div>
					</Dialog.Panel>
				</div>
			</Dialog>
		</div>
	);
};
