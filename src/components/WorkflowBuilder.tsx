import React, { useState } from 'react';
import { Plus, Trash2, HelpCircle, Calculator } from 'lucide-react';
import { Question, WorkflowRule, FormWorkflow } from '../types';

interface WorkflowBuilderProps {
	questions: Question[];
	workflow: FormWorkflow;
	onChange: (workflow: FormWorkflow) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
	questions,
	workflow,
	onChange,
}) => {
	const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

	const destinationOptions = [
		...questions.map((question, index) => ({
			id: question.id,
			label: `${index + 1} - ${question.title}`,
			type: 'question',
			icon: '❓',
		})),
		{
			id: 'end_form',
			label: 'Finalizar Formulário',
			type: 'end',
			icon: '🏁',
		},
	];

	const operators = [
		{ value: 'equals', label: 'é igual a' },
		{ value: 'not_equals', label: 'não é igual a' },
		{ value: 'contains', label: 'contém' },
		{ value: 'not_contains', label: 'não contém' },
		{ value: 'greater_than', label: 'é maior que' },
		{ value: 'less_than', label: 'é menor que' },
	];

	const addRule = (type: 'if' | 'always') => {
		const newRule: WorkflowRule = {
			id: Date.now().toString(),
			type,
			conditions:
				type === 'if'
					? [
							{
								questionId: '',
								operator: 'equals',
								value: '',
								logicalOperator: 'AND',
							},
					  ]
					: undefined,
			operation:
				type === 'always'
					? {
							type: 'add',
							variable: 'score',
							operand: 0,
					  }
					: undefined,
			actions: [
				{
					type: 'jumpTo',
					targetQuestionId: '',
				},
			],
		};
		setEditingRule(newRule);
	};

	const saveRule = (rule: WorkflowRule) => {
		const existingIndex = workflow.rules.findIndex((r) => r.id === rule.id);
		const newRules = [...workflow.rules];

		if (existingIndex >= 0) {
			newRules[existingIndex] = rule;
		} else {
			newRules.push(rule);
		}

		onChange({
			...workflow,
			rules: newRules,
		});
		setEditingRule(null);
	};

	const deleteRule = (ruleId: string) => {
		onChange({
			...workflow,
			rules: workflow.rules.filter((r) => r.id !== ruleId),
		});
	};

	const addCondition = (rule: WorkflowRule) => {
		const newCondition = {
			questionId: '',
			operator: 'equals' as const,
			value: '',
			logicalOperator: 'AND' as const,
		};

		setEditingRule({
			...rule,
			conditions: [...(rule.conditions || []), newCondition],
		});
	};

	const removeCondition = (rule: WorkflowRule, conditionIndex: number) => {
		const newConditions = rule.conditions?.filter((_, index) => index !== conditionIndex) || [];
		setEditingRule({
			...rule,
			conditions: newConditions,
		});
	};

	const getDestinationLabel = (destinationId: string) => {
		if (destinationId === 'end_form') {
			return 'Finalizar Formulário';
		}

		const question = questions.find((q) => q.id === destinationId);
		return question ? question.title : 'Pergunta não encontrada';
	};

	const getRuleTypeIcon = (type: string) => {
		return type === 'if' ? (
			<HelpCircle size={16} className='text-blue-600' />
		) : (
			<Calculator size={16} className='text-green-600' />
		);
	};

	return (
		<div className='space-y-6 p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-xl font-semibold text-gray-900'>Workflow Builder</h2>
					<p className='text-gray-600 text-sm mt-1'>
						Configure regras condicionais para navegação entre perguntas
					</p>
				</div>
				<div className='flex items-center space-x-2 text-xs text-gray-500'>
					<HelpCircle size={14} />
					<span>Ordem de avaliação: de cima para baixo</span>
				</div>
			</div>

			{/* Add Rule Buttons */}
			<div className='flex items-center justify-between'>
				<h3 className='text-lg font-medium text-gray-900'>Regras</h3>
				<div className='flex space-x-2'>
					<button
						onClick={() => addRule('if')}
						className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2'
					>
						<Plus size={16} />
						<span>Regra Condicional</span>
					</button>
					<button
						onClick={() => addRule('always')}
						className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2'
					>
						<Plus size={16} />
						<span>Regra Sempre</span>
					</button>
				</div>
			</div>

			{/* Lista de Regras */}
			<div className='space-y-4'>
				{workflow.rules.map((rule, index) => (
					<div key={rule.id} className='bg-white border border-gray-200 rounded-lg p-4 shadow-sm'>
						<div className='flex items-center justify-between mb-3'>
							<div className='flex items-center space-x-3'>
								{getRuleTypeIcon(rule.type)}
								<span className='font-medium text-gray-900 capitalize'>
									{rule.type === 'if' ? 'Se' : 'Sempre'} - Regra {index + 1}
								</span>
							</div>
							<div className='flex items-center space-x-2'>
								<button
									onClick={() => setEditingRule(rule)}
									className='px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
								>
									Editar
								</button>
								<button
									onClick={() => deleteRule(rule.id)}
									className='px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors'
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>

						{/* Preview da Regra */}
						<div className='text-sm text-gray-600 bg-gray-50 rounded p-3'>
							{rule.type === 'if' && rule.conditions && (
								<div>
									<strong>Condições:</strong>{' '}
									{rule.conditions.map((cond, i) => (
										<span key={i}>
											{i > 0 && ` ${cond.logicalOperator || 'E'} `}
											Pergunta "
											{questions.find((q) => q.id === cond.questionId)?.title ||
												'Não selecionada'}"{' '}
											{operators.find((op) => op.value === cond.operator)?.label} "{cond.value}"
										</span>
									))}
								</div>
							)}

							{rule.actions && rule.actions.length > 0 && (
								<div className='mt-1'>
									<strong>Ações:</strong>{' '}
									{rule.actions.map((action, i) => (
										<span key={i}>
											{i > 0 && ', '}
											{action.type === 'jumpTo' &&
												`Ir para ${getDestinationLabel(action.targetQuestionId || '')}`}
											{action.type === 'endForm' && 'Finalizar formulário'}
											{action.type === 'showMessage' && `Mostrar: "${action.message}"`}
										</span>
									))}
								</div>
							)}
						</div>
					</div>
				))}

				{workflow.rules.length === 0 && (
					<div className='text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg'>
						<p>Nenhuma regra condicional configurada.</p>
						<p className='text-sm'>Clique em "Regra Condicional" ou "Regra Sempre" para começar.</p>
					</div>
				)}
			</div>

			{/* Modal de Edição de Regra */}
			{editingRule && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
					<div className='bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
						<div className='flex items-center justify-between mb-6'>
							<h3 className='text-xl font-semibold text-gray-900'>
								{workflow.rules.find((r) => r.id === editingRule.id) ? 'Editar' : 'Nova'} Regra{' '}
								{editingRule.type === 'if' ? 'Condicional' : 'Sempre'}
							</h3>
							<div className='flex items-center space-x-2'>
								{getRuleTypeIcon(editingRule.type)}
								<span className='text-sm text-gray-600 capitalize'>{editingRule.type}</span>
							</div>
						</div>

						<div className='space-y-6'>
							{/* Condições (apenas para If) */}
							{editingRule.type === 'if' && (
								<div>
									<div className='flex items-center justify-between mb-4'>
										<h4 className='text-lg font-medium text-gray-900'>Condições</h4>
										<button
											onClick={() => addCondition(editingRule)}
											className='px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-2'
										>
											<Plus size={16} />
											<span>Adicionar condição</span>
										</button>
									</div>

									{editingRule.conditions?.map((condition, index) => (
										<div key={index} className='border border-gray-200 rounded-lg p-4 mb-4'>
											<div className='grid grid-cols-1 md:grid-cols-5 gap-4 items-end'>
												<div>
													{index > 0 && (
														<select
															value={condition.logicalOperator || 'AND'}
															onChange={(e) => {
																const newConditions = [...(editingRule.conditions || [])];
																newConditions[index] = {
																	...condition,
																	logicalOperator: e.target.value as 'AND' | 'OR',
																};
																setEditingRule({ ...editingRule, conditions: newConditions });
															}}
															className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
														>
															<option value='AND'>E</option>
															<option value='OR'>OU</option>
														</select>
													)}
												</div>

												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Pergunta
													</label>
													<select
														value={condition.questionId}
														onChange={(e) => {
															const newConditions = [...(editingRule.conditions || [])];
															newConditions[index] = { ...condition, questionId: e.target.value };
															setEditingRule({ ...editingRule, conditions: newConditions });
														}}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													>
														<option value=''>Selecione...</option>
														{questions.map((question) => (
															<option key={question.id} value={question.id}>
																{question.title}
															</option>
														))}
													</select>
												</div>

												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Operador
													</label>
													<select
														value={condition.operator}
														onChange={(e) => {
															const newConditions = [...(editingRule.conditions || [])];
															newConditions[index] = {
																...condition,
																operator: e.target.value as any,
															};
															setEditingRule({ ...editingRule, conditions: newConditions });
														}}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													>
														{operators.map((op) => (
															<option key={op.value} value={op.value}>
																{op.label}
															</option>
														))}
													</select>
												</div>

												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Valor
													</label>
													<input
														type='text'
														value={condition.value}
														onChange={(e) => {
															const newConditions = [...(editingRule.conditions || [])];
															newConditions[index] = { ...condition, value: e.target.value };
															setEditingRule({ ...editingRule, conditions: newConditions });
														}}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
														placeholder='Digite o valor...'
													/>
												</div>

												<div className='flex items-end space-x-2'>
													{editingRule.conditions && editingRule.conditions.length > 1 && (
														<button
															onClick={() => removeCondition(editingRule, index)}
															className='p-2 text-red-500 hover:text-red-700'
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</div>
										</div>
									))}
								</div>
							)}

							{/* Ações */}
							<div>
								<h4 className='text-lg font-medium text-gray-900 mb-4'>Ações</h4>
								{editingRule.actions?.map((action, index) => (
									<div key={index} className='border border-gray-200 rounded-lg p-4 mb-4'>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<label className='block text-sm font-medium text-gray-700 mb-2'>
													Tipo de Ação
												</label>
												<select
													value={action.type}
													onChange={(e) => {
														const newActions = [...(editingRule.actions || [])];
														newActions[index] = { ...action, type: e.target.value as any };
														setEditingRule({ ...editingRule, actions: newActions });
													}}
													className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
												>
													<option value='jumpTo'>Ir para</option>
													<option value='endForm'>Finalizar formulário</option>
													<option value='showMessage'>Mostrar mensagem</option>
												</select>
											</div>

											{action.type === 'jumpTo' && (
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Destino
													</label>
													<select
														value={action.targetQuestionId || ''}
														onChange={(e) => {
															const newActions = [...(editingRule.actions || [])];
															newActions[index] = { ...action, targetQuestionId: e.target.value };
															setEditingRule({ ...editingRule, actions: newActions });
														}}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
													>
														<option value=''>Selecione...</option>
														{destinationOptions.map((dest) => (
															<option key={dest.id} value={dest.id}>
																{dest.icon} {dest.label}
															</option>
														))}
													</select>
												</div>
											)}

											{action.type === 'showMessage' && (
												<div>
													<label className='block text-sm font-medium text-gray-700 mb-2'>
														Mensagem
													</label>
													<textarea
														value={action.message || ''}
														onChange={(e) => {
															const newActions = [...(editingRule.actions || [])];
															newActions[index] = { ...action, message: e.target.value };
															setEditingRule({ ...editingRule, actions: newActions });
														}}
														className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
														rows={3}
														placeholder='Digite a mensagem...'
													/>
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className='flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200'>
							<button
								onClick={() => setEditingRule(null)}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
							>
								Cancelar
							</button>
							<button
								onClick={() => saveRule(editingRule)}
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors'
							>
								Salvar Regra
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
