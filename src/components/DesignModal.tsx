import React, { useState } from 'react';
import { Form } from '../types';

interface DesignModalProps {
	form: Form;
	onClose: () => void;
	onSave: (design: NonNullable<Form['design']>) => void;
}

export const DesignModal: React.FC<DesignModalProps> = ({ form, onClose, onSave }) => {
	const [tab, setTab] = useState<'font' | 'buttons' | 'background'>('font');
	const [draft, setDraft] = useState<NonNullable<Form['design']>>({
		fontFamily: form.design?.fontFamily || '',
		titleColor: form.design?.titleColor || '#111827',
		questionColor: form.design?.questionColor || '#111827',
		buttonColor: form.design?.buttonColor || '',
		buttonTextColor: form.design?.buttonTextColor || '',
		welcomeSize: form.design?.welcomeSize || 'md',
		welcomeAlign: form.design?.welcomeAlign || 'center',
		cornerRadius: form.design?.cornerRadius ?? 12,
		backgroundColor: form.design?.backgroundColor || '#f8fafc',
		backgroundImageUrl: form.design?.backgroundImageUrl || '',
	});

	const updateDraft = (updates: Partial<NonNullable<Form['design']>>) =>
		setDraft((prev) => ({ ...prev, ...updates }));

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center'>
			<div className='absolute inset-0 bg-black/50' onClick={onClose} />
			<div className='relative bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl'>
				<div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>
					<h4 className='text-base font-semibold text-gray-900'>Design</h4>
					<button onClick={onClose} className='text-gray-400 hover:text-gray-600'>
						✕
					</button>
				</div>
				<div className='flex'>
					<div className='w-40 border-r border-gray-100 p-4 space-y-2'>
						<button
							onClick={() => setTab('font')}
							className={`w-full text-left px-2 py-2 rounded ${
								tab === 'font' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
							}`}
						>
							Font
						</button>
						<button
							onClick={() => setTab('buttons')}
							className={`w-full text-left px-2 py-2 rounded ${
								tab === 'buttons' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
							}`}
						>
							Buttons
						</button>
						<button
							onClick={() => setTab('background')}
							className={`w-full text-left px-2 py-2 rounded ${
								tab === 'background'
									? 'bg-gray-100 text-gray-900'
									: 'text-gray-700 hover:bg-gray-50'
							}`}
						>
							Background
						</button>
					</div>
					<div className='flex-1 p-6 space-y-6'>
						{tab === 'font' && (
							<div className='space-y-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>Fonte</label>
									<select
										value={draft.fontFamily || ''}
										onChange={(e) => updateDraft({ fontFamily: e.target.value })}
										className='w-full px-3 py-2 border border-gray-300 rounded-md'
									>
										<option value=''>Padrão</option>
										<option value={'Inter, system-ui, sans-serif'}>Inter</option>
										<option value={'Arial, sans-serif'}>Arial</option>
										<option value={'Georgia, serif'}>Georgia</option>
										<option value={'Roboto, system-ui, sans-serif'}>Roboto</option>
									</select>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Cor dos títulos
										</label>
										<input
											type='color'
											value={draft.titleColor || '#111827'}
											onChange={(e) => updateDraft({ titleColor: e.target.value })}
											className='h-10 w-full p-1 border border-gray-300 rounded'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Cor das questões
										</label>
										<input
											type='color'
											value={draft.questionColor || '#111827'}
											onChange={(e) => updateDraft({ questionColor: e.target.value })}
											className='h-10 w-full p-1 border border-gray-300 rounded'
										/>
									</div>
								</div>

								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-end'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Tamanho (welcome/final)
										</label>
										<div className='inline-flex rounded-md border border-gray-300 overflow-hidden'>
											{(['sm', 'md', 'lg'] as const).map((s) => (
												<button
													key={s}
													type='button'
													onClick={() => updateDraft({ welcomeSize: s })}
													className={`px-3 py-1 text-sm ${
														draft.welcomeSize === s
															? 'bg-gray-900 text-white'
															: 'bg-white text-gray-700 hover:bg-gray-50'
													}`}
												>
													{s}
												</button>
											))}
										</div>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Alinhamento
										</label>
										<div className='inline-flex rounded-md border border-gray-300 overflow-hidden'>
											{(['left', 'center'] as const).map((a) => (
												<button
													key={a}
													type='button'
													onClick={() => updateDraft({ welcomeAlign: a })}
													className={`px-3 py-1 text-sm capitalize ${
														draft.welcomeAlign === a
															? 'bg-gray-900 text-white'
															: 'bg-white text-gray-700 hover:bg-gray-50'
													}`}
												>
													{a}
												</button>
											))}
										</div>
									</div>
								</div>
							</div>
						)}

						{tab === 'buttons' && (
							<div className='space-y-6'>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Cor do botão
										</label>
										<input
											type='color'
											value={draft.buttonColor || '#2563eb'}
											onChange={(e) => updateDraft({ buttonColor: e.target.value })}
											className='h-10 w-full p-1 border border-gray-300 rounded'
										/>
									</div>
									<div>
										<label className='block text-sm font-medium text-gray-700 mb-2'>
											Cor do texto do botão
										</label>
										<input
											type='color'
											value={draft.buttonTextColor || '#ffffff'}
											onChange={(e) => updateDraft({ buttonTextColor: e.target.value })}
											className='h-10 w-full p-1 border border-gray-300 rounded'
										/>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Cor das perguntas
									</label>
									<input
										type='color'
										value={draft.questionColor || '#111827'}
										onChange={(e) => updateDraft({ questionColor: e.target.value })}
										className='h-10 w-full p-1 border border-gray-300 rounded'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Corner radius
									</label>
									<input
										type='number'
										min={0}
										max={64}
										value={draft.cornerRadius ?? 12}
										onChange={(e) => updateDraft({ cornerRadius: Number(e.target.value || 0) })}
										className='w-32 px-3 py-2 border border-gray-300 rounded-md'
									/>
								</div>
							</div>
						)}

						{tab === 'background' && (
							<div className='space-y-6'>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Cor de fundo
									</label>
									<input
										type='color'
										value={draft.backgroundColor || '#f8fafc'}
										onChange={(e) => updateDraft({ backgroundColor: e.target.value })}
										className='h-10 w-full p-1 border border-gray-300 rounded'
									/>
								</div>
								<div>
									<label className='block text-sm font-medium text-gray-700 mb-2'>
										Imagem de fundo (URL)
									</label>
									<div className='flex items-center space-x-2'>
										<input
											type='url'
											value={draft.backgroundImageUrl || ''}
											onChange={(e) => updateDraft({ backgroundImageUrl: e.target.value })}
											placeholder='https://...'
											className='flex-1 px-3 py-2 border border-gray-300 rounded-md'
										/>
										<button
											type='button'
											onClick={() => updateDraft({ backgroundImageUrl: '' })}
											className='px-3 py-2 text-sm border rounded-md'
										>
											Remover
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
				<div className='px-5 py-4 border-t border-gray-200 flex justify-end space-x-2'>
					<button className='px-4 py-2 text-sm font-medium rounded-md border' onClick={onClose}>
						Cancelar
					</button>
					<button
						className='px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
						onClick={() => {
							onSave(draft);
							onClose();
						}}
					>
						Salvar
					</button>
				</div>
			</div>
		</div>
	);
};

export default DesignModal;
