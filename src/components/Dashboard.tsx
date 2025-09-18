import React, { useState } from 'react';
import { Plus, Edit3, BarChart3, MoreVertical, Share2, Copy, Trash2 } from 'lucide-react';
import { Form } from '../types';
import { formatDate } from '../utils/helpers';

interface DashboardProps {
	forms: Form[];
	onCreateForm: () => void;
	onEditForm: (form: Form) => void;
	onViewResults: (form: Form) => void;
	onDeleteForm: (formId: string) => void;
	onDuplicateForm: (form: Form) => void;
	onShareForm: (form: Form) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
	forms,
	onCreateForm,
	onEditForm,
	onViewResults,
	onDeleteForm,
	onDuplicateForm,
	onShareForm,
}) => {
	const [shareForm, setShareForm] = useState<Form | null>(null);
	const [copied, setCopied] = useState(false);

	const currentShareUrl = shareForm ? `${window.location.origin}/form/${shareForm.id}` : '';

	const handleCopyShareUrl = async () => {
		try {
			await navigator.clipboard.writeText(currentShareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch (e) {
			console.error('Erro ao copiar link:', e);
		}
	};

	return (
		<div className=' mx-auto px-4 sm:px-6 lg:px-8 py-8'>
			{/* Header */}
			<div className='flex justify-between items-center mb-8'>
				<div>
					<h1 className='text-2xl font-semibold text-gray-900'>Meus Formulários</h1>
					<p className='mt-2 text-gray-600'>Gerencie seus formulários e acompanhe as respostas</p>
				</div>
				<button
					onClick={onCreateForm}
					className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
				>
					<Plus className='h-5 w-5 mr-2' />
					Novo Formulário
				</button>
			</div>

			{/* Forms Grid */}
			{forms.length === 0 ? (
				<div className='text-center py-12'>
					<div className='mx-auto h-12 w-12 text-gray-400'>
						<svg fill='none' stroke='currentColor' viewBox='0 0 48 48' aria-hidden='true'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0122 34c3.292 0 6.24 1.581 8.056 4.286'
							/>
						</svg>
					</div>
					<h3 className='mt-2 text-sm font-medium text-gray-900'>Nenhum formulário</h3>
					<p className='mt-1 text-sm text-gray-500'>Comece criando seu primeiro formulário.</p>
					<div className='mt-6'>
						<button
							onClick={onCreateForm}
							className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
						>
							<Plus className='h-4 w-4 mr-2' />
							Criar Formulário
						</button>
					</div>
				</div>
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{forms.map((form) => (
						<div
							key={form.id}
							className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow'
						>
							<div className='flex items-start justify-between'>
								<div className='flex-1 min-w-0'>
									<h3 className='text-lg font-medium text-gray-900 truncate'>{form.title}</h3>
									{form.description && (
										<p className='mt-1 text-sm text-gray-500 line-clamp-2'>{form.description}</p>
									)}
								</div>
								<div className='ml-4 flex-shrink-0'>
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											form.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
										}`}
									>
										{form.isPublished ? 'Publicado' : 'Rascunho'}
									</span>
								</div>
							</div>

							<div className='mt-4 flex items-center justify-between text-sm text-gray-500'>
								<span>Criado em {formatDate(form.createdAt)}</span>
								<span className='font-medium'>{form.responseCount} respostas</span>
							</div>

							<div className='mt-6 flex items-center space-x-2 justify-between'>
								<div className='flex items-center space-x-2'>
									<button
										onClick={() => onEditForm(form)}
										className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
									>
										<Edit3 className='h-4 w-4 mr-2' />
										Editar
									</button>
									<button
										onClick={() => onViewResults(form)}
										className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
									>
										<BarChart3 className='h-4 w-4 mr-2' />
										Resultados
									</button>
								</div>

								{/* Sandwich menu for extra actions */}
								<div className='relative inline-block text-left'>
									<details className='group'>
										<summary className='list-none inline-flex items-center px-2 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none cursor-pointer'>
											<MoreVertical className='h-4 w-4' />
										</summary>
										<div className='absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10'>
											<div className='py-1'>
												<button
													onClick={(e) => {
														const details = e.currentTarget.closest(
															'details'
														) as HTMLDetailsElement | null;
														if (details) details.open = false;
														setShareForm(form);
													}}
													className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center'
												>
													<Share2 className='h-4 w-4 mr-2' /> Compartilhar
												</button>
												<button
													onClick={(e) => {
														const details = e.currentTarget.closest(
															'details'
														) as HTMLDetailsElement | null;
														if (details) details.open = false;
														onDuplicateForm(form);
													}}
													className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center'
												>
													<Copy className='h-4 w-4 mr-2' /> Duplicar
												</button>
												<button
													onClick={(e) => {
														const details = e.currentTarget.closest(
															'details'
														) as HTMLDetailsElement | null;
														if (details) details.open = false;
														onDeleteForm(form.id);
													}}
													className='w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center'
												>
													<Trash2 className='h-4 w-4 mr-2' /> Deletar
												</button>
											</div>
										</div>
									</details>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Share Modal */}
			{shareForm && (
				<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
					<div className='absolute inset-0 bg-black/50' onClick={() => setShareForm(null)} />
					<div className='relative bg-white w-full max-w-lg rounded-lg shadow-lg border border-gray-200'>
						<div className='p-4 border-b border-gray-200 flex items-center justify-between'>
							<h3 className='text-lg font-semibold text-gray-900'>Compartilhar formulário</h3>
							<button
								className='text-gray-400 hover:text-gray-600'
								onClick={() => setShareForm(null)}
							>
								✕
							</button>
						</div>
						<div className='p-6 space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Link público</label>
								<div className='flex items-center gap-2'>
									<input
										type='text'
										readOnly
										value={currentShareUrl}
										className='flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900'
									/>
									<button
										onClick={handleCopyShareUrl}
										className={`px-4 py-2 rounded-md text-sm font-medium ${
											copied
												? 'bg-green-100 text-green-700 border border-green-300'
												: 'bg-blue-600 text-white hover:bg-blue-700'
										}`}
									>
										{copied ? 'Copiado!' : 'Copiar'}
									</button>
								</div>
							</div>

							<div className='text-sm text-gray-600'>
								Você também pode incorporar este formulário em uma página usando a aba Compartilhar
								no editor.
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
