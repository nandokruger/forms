import React, { useState } from 'react';
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
} from 'lucide-react';
import { Form, Question, QuestionType, FormWorkflow, FinalScreen } from '../types';
import { createEmptyQuestion, getQuestionTypeLabel } from '../utils/helpers';
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
	const [activeTab, setActiveTab] = useState<'content' | 'workflow' | 'settings' | 'share'>(
		'content'
	);
	const [showDesign, setShowDesign] = useState(false);
	const [selectedFinalId, setSelectedFinalId] = useState<string | null>(null);

	const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId);
	const finals = form.finals || [];
	const selectedFinal = finals.find((f) => f.id === selectedFinalId) || null;

	const addQuestion = () => {
		const newQuestion = createEmptyQuestion(form.questions.length + 1);
		const updatedForm = {
			...form,
			questions: [...form.questions, newQuestion],
		};
		onUpdateForm(updatedForm);
		setSelectedFinalId(null);
		setSelectedQuestionId(newQuestion.id);
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

	//

	return (
		<div className='h-screen bg-gray-50 flex'>
			{/* Left Sidebar - Questions List */}
			<div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
				<div className='p-6 border-b border-gray-200'>
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-lg font-semibold text-gray-900'>Perguntas</h2>
						<button
							onClick={addQuestion}
							className='p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'
						>
							<Plus className='h-5 w-5' />
						</button>
					</div>

					<div className='relative'>
						<details className='group'>
							<summary className='list-none w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer flex items-center justify-between'>
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
								<ChevronDown className='h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform' />
							</summary>
							<div className='absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden'>
								<button
									onClick={(e) => {
										setActiveTab('content');
										const details = e.currentTarget.closest('details') as HTMLDetailsElement | null;
										if (details) details.open = false;
									}}
									className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
								>
									<FileText className='h-4 w-4 mr-2 text-gray-600' /> Conteúdo
								</button>
								<button
									onClick={(e) => {
										setActiveTab('workflow');
										const details = e.currentTarget.closest('details') as HTMLDetailsElement | null;
										if (details) details.open = false;
									}}
									className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
								>
									<Workflow className='h-4 w-4 mr-2 text-gray-600' /> Workflow
								</button>
								<button
									onClick={(e) => {
										setActiveTab('settings');
										const details = e.currentTarget.closest('details') as HTMLDetailsElement | null;
										if (details) details.open = false;
									}}
									className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
								>
									<Settings className='h-4 w-4 mr-2 text-gray-600' /> Configurações
								</button>
								<button
									onClick={(e) => {
										setActiveTab('share');
										const details = e.currentTarget.closest('details') as HTMLDetailsElement | null;
										if (details) details.open = false;
									}}
									className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
								>
									<Share2 className='h-4 w-4 mr-2 text-gray-600' /> Share
								</button>
							</div>
						</details>
					</div>
				</div>

				<div className='flex-1 overflow-y-auto p-4'>
					{form.questions.length === 0 ? (
						<div className='text-center py-8 text-gray-500'>
							<p className='text-sm'>Nenhuma pergunta ainda.</p>
							<p className='text-sm'>Clique no + para adicionar.</p>
						</div>
					) : (
						<div className='space-y-2'>
							{form.questions.map((question, index) => (
								<div
									key={question.id}
									className={`p-3 rounded-lg border transition-all cursor-pointer ${
										selectedQuestionId === question.id && !selectedFinalId
											? 'bg-blue-50 border-blue-200'
											: 'bg-white border-gray-200 hover:border-gray-300'
									}`}
									onClick={() => {
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
													deleteQuestion(question.id);
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
											selectedFinalId === f.id && !selectedQuestionId
												? 'bg-blue-50 border-blue-200'
												: 'bg-white border-gray-200 hover:border-gray-300'
										}`}
										onClick={() => {
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
														deleteFinal(f.id);
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
							<button onClick={onBack} className='text-gray-400 hover:text-gray-600'>
								← Voltar
							</button>
							<h1 className='text-xl font-semibold text-gray-900'>{form.title}</h1>
						</div>
						<div className='flex items-center space-x-3'>
							<button
								onClick={onPreview}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
							>
								Visualizar
							</button>
							<button
								onClick={onSave}
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors'
							>
								Salvar
							</button>
						</div>
					</div>
				</div>

				{/* Editor Content */}
				<div className='flex-1'>
					{activeTab === 'content' ? (
						selectedQuestion ? (
							<div className='max-w-2xl mx-auto p-6'>
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
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
												placeholder='Adicione uma descrição...'
											/>
										</div>

										{/* Question Type Selector */}
										<div>
											<label className='block text-sm font-medium text-gray-700 mb-2'>
												Tipo de pergunta
											</label>
											<select
												value={selectedQuestion.type}
												onChange={(e) =>
													updateQuestion(selectedQuestion.id, {
														type: e.target.value as QuestionType,
													})
												}
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
											>
												<option value='short-text'>Texto Curto</option>
												<option value='long-text'>Texto Longo</option>
												<option value='multiple-choice'>Múltipla Escolha</option>
												<option value='email'>E-mail</option>
												<option value='number'>Número</option>
												<option value='date'>Data</option>
												<option value='rating'>Avaliação</option>
											</select>
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

										{/* Required Toggle */}
										<div className='flex items-center'>
											<input
												type='checkbox'
												id='required'
												checked={selectedQuestion.required}
												onChange={(e) =>
													updateQuestion(selectedQuestion.id, {
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
						) : selectedFinal ? (
							<div className='max-w-2xl mx-auto p-6'>
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
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
												className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
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
													className='w-full px-3 py-2 border border-gray-300 rounded-md'
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
						<div className='max-w-6xl mx-auto'>
							<ShareEmbed form={form} onBack={() => setActiveTab('content')} />
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
		</div>
	);
};
