import React, { useState } from 'react';
import {
	Link,
	Globe,
	Target,
	Copy,
	Code,
	Trash2,
	Check,
	Monitor,
	Smartphone,
	ChevronDown,
} from 'lucide-react';
import { Form } from '../types';

interface ShareEmbedProps {
	form: Form;
	onBack?: () => void;
}

type ShareTab = 'link' | 'embed' | 'targeted';

interface EmbedConfig {
	name: string;
	mode: 'fullwidth' | 'card' | 'popup' | 'floating' | 'sidebar' | 'slideTab';
	width: number;
	widthUnit: '%' | 'px';
	height: 'auto' | 'fixed';
	heightValue: number;
	fullscreenMobile: boolean;
	hideHeaders: boolean;
	backgroundTransparency: number;
	// New fields for mode-specific settings
	popupSize?: 'grande' | 'medio' | 'pequeno';
	buttonText?: string;
	buttonColor?: string;
	fontSize?: number; // px
	borderRadius?: number; // px
	textButton?: boolean;
	sidebarPosition?: 'esquerda' | 'direita';
	customIcon?: boolean;
	notificationDot?: boolean;
	slideTabText?: string;
}

export const ShareEmbed: React.FC<ShareEmbedProps> = ({ form }) => {
	const [activeTab, setActiveTab] = useState<ShareTab>('link');
	const [linkCopied, setLinkCopied] = useState(false);
	const [codeCopied, setCodeCopied] = useState(false);
	const [showCodeModal, setShowCodeModal] = useState(false);
	const [useScriptEmbed, setUseScriptEmbed] = useState(false);
	// UI state for live previews
	const [isPopupOpen, setIsPopupOpen] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [isFloatingOpen, setIsFloatingOpen] = useState(false);
	const [isSlideOpen, setIsSlideOpen] = useState(false);

	const [embedConfig, setEmbedConfig] = useState<EmbedConfig>({
		name: `${form.title} - Embed`,
		mode: 'card',
		width: 100,
		widthUnit: '%',
		height: 'auto',
		heightValue: 600,
		fullscreenMobile: true,
		hideHeaders: false,
		backgroundTransparency: 0,
		popupSize: 'medio',
		buttonText: 'experimente',
		buttonColor: '#2563eb',
		fontSize: 17,
		borderRadius: 100,
		textButton: false,
		sidebarPosition: 'direita',
		customIcon: false,
		notificationDot: false,
		slideTabText: 'experimente',
	});

	const applyPreset = (preset: 'standard' | 'fullwidth') => {
		if (preset === 'standard') {
			setEmbedConfig((prev) => ({
				...prev,
				mode: 'card',
				height: 'fixed',
				heightValue: 500,
				width: 100,
				widthUnit: '%',
				fullscreenMobile: true,
			}));
			setUseScriptEmbed(false);
		}
		if (preset === 'fullwidth') {
			setEmbedConfig((prev) => ({
				...prev,
				mode: 'fullwidth',
			}));
			setUseScriptEmbed(false);
		}
	};

	const formUrl = `${window.location.origin}/form/${form.id}`;
	const embedUrl = `${formUrl}?embed=true${embedConfig.hideHeaders ? '&hideHeaders=true' : ''}`;

	const getPopupDimensions = () => {
		switch (embedConfig.popupSize) {
			case 'grande':
				return { width: 900, height: 640 };
			case 'pequeno':
				return { width: 420, height: 360 };
			case 'medio':
			default:
				return { width: 680, height: 520 };
		}
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(formUrl);
			setLinkCopied(true);
			setTimeout(() => setLinkCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	};

	const generateEmbedCode = () => {
		// Common values
		const width =
			embedConfig.widthUnit === '%' ? `${embedConfig.width}%` : `${embedConfig.width}px`;
		const height = embedConfig.height === 'auto' ? 'auto' : `${embedConfig.heightValue}px`;
		const opacity = (100 - embedConfig.backgroundTransparency) / 100;
		const baseUrl = `${formUrl}?embed=true${embedConfig.hideHeaders ? '&hideHeaders=true' : ''}`;

		// Unique ids to avoid collisions when pasting multiple embeds
		const uid = `opforms_${form.id.replace(/[^a-zA-Z0-9_\-]/g, '')}`;

		// Script-based embed snippet
		if (useScriptEmbed) {
			const attrs: string[] = [
				`data-opforms`,
				'',
				`data-id="${form.id}"`,
				`data-origin="${window.location.origin}"`,
				`data-mode="${embedConfig.mode}"`,
				`data-hide-headers="${embedConfig.hideHeaders ? 'true' : 'false'}"`,
			];
			if (embedConfig.mode === 'card' || embedConfig.mode === 'fullwidth') {
				attrs.push(
					`data-width="${embedConfig.width}"`,
					`data-width-unit="${embedConfig.widthUnit}"`,
					`data-height="${embedConfig.height}"`,
					`data-height-value="${embedConfig.heightValue}"`,
					`data-border-radius="8"`
				);
			}
			if (embedConfig.mode === 'popup') {
				attrs.push(
					`data-popup-size="${embedConfig.popupSize}"`,
					`data-button-text="${embedConfig.buttonText || 'experimente'}"`,
					`data-button-color="${embedConfig.buttonColor || '#2563eb'}"`,
					`data-font-size="${embedConfig.fontSize || 17}"`,
					`data-border-radius="${embedConfig.borderRadius || 100}"`,
					`data-text-button="${embedConfig.textButton ? 'true' : 'false'}"`
				);
			}
			const div = `<div ${attrs.join(' ').trim()}></div>`;
			const script = `<script src="${window.location.origin}/embed.js" async></script>`;
			return `${div}
${script}`;
		}

		// Card / Fullwidth default iframe
		if (embedConfig.mode === 'card' || embedConfig.mode === 'fullwidth') {
			return `<iframe 
	  src="${baseUrl}"
	  width="${width}"
	  height="${height}"
	  frameborder="0"
	  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: rgba(255, 255, 255, ${opacity});"
	  ${embedConfig.fullscreenMobile ? 'data-fullscreen-mobile="true"' : ''}
	></iframe>`;
		}

		// Popup embed: button + lightweight modal with iframe
		if (embedConfig.mode === 'popup') {
			const dims = (() => {
				switch (embedConfig.popupSize) {
					case 'grande':
						return { w: 900, h: 640 };
					case 'pequeno':
						return { w: 420, h: 360 };
					case 'medio':
					default:
						return { w: 680, h: 520 };
				}
			})();
			const isTextBtn = !!embedConfig.textButton;
			const btnBg = isTextBtn ? 'transparent' : embedConfig.buttonColor || '#2563eb';
			const btnColor = isTextBtn ? embedConfig.buttonColor || '#2563eb' : '#ffffff';
			const btnBorder = isTextBtn ? 'none' : 'none';
			const btnText = embedConfig.buttonText || 'experimente';
			const btnRadius = `${embedConfig.borderRadius ?? 100}px`;
			const btnFontSize = `${embedConfig.fontSize ?? 17}px`;

			return `<!-- OpForms Popup Embed -->
	<div style="display:flex;align-items:center;justify-content:center;width:100%;">
	  <button id="${uid}_open" style="background:${btnBg};color:${btnColor};border:${btnBorder};border-radius:${btnRadius};font-size:${btnFontSize};${
				isTextBtn ? 'padding:0;text-decoration:underline;box-shadow:none;' : 'padding:10px 16px;'
			};cursor:pointer;">
	    ${btnText}
	  </button>
	</div>
	<div id="${uid}_overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:9999;">
	  <div id="${uid}_modal" style="background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);position:relative;width:${
				dims.w
			}px;height:${dims.h}px;max-width:95vw;max-height:90vh;">
		<button id="${uid}_close" aria-label="Fechar" style="position:absolute;top:8px;right:10px;background:transparent;border:none;font-size:22px;line-height:1;cursor:pointer;color:#6b7280;">×</button>
		<iframe src="${baseUrl}" style="width:100%;height:100%;border:0;border-radius:12px"></iframe>
	  </div>
	</div>
	<script>(function(){
	  var openBtn=document.getElementById('${uid}_open');
	  var overlay=document.getElementById('${uid}_overlay');
	  var closeBtn=document.getElementById('${uid}_close');
	  if(!openBtn||!overlay||!closeBtn) return;
	  openBtn.addEventListener('click',function(){overlay.style.display='flex'});
	  closeBtn.addEventListener('click',function(){overlay.style.display='none'});
	  overlay.addEventListener('click',function(e){ if(e.target===overlay){ overlay.style.display='none'; }});
	})();</script>`;
		}

		// Fallback to simple iframe for other modes for now
		return `<iframe 
	  src="${baseUrl}"
	  width="${width}"
	  height="${height}"
	  frameborder="0"
	  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); background-color: rgba(255, 255, 255, ${opacity});"
	  ${embedConfig.fullscreenMobile ? 'data-fullscreen-mobile="true"' : ''}
	></iframe>`;
	};

	const handleCopyCode = async () => {
		try {
			await navigator.clipboard.writeText(generateEmbedCode());
			setCodeCopied(true);
			setTimeout(() => setCodeCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy code:', err);
		}
	};

	const updateEmbedConfig = (updates: Partial<EmbedConfig>) => {
		setEmbedConfig((prev) => ({ ...prev, ...updates }));
	};

	const renderLinkContent = () => (
		<div className='space-y-6'>
			<div>
				<label className='block text-sm font-medium text-gray-700 mb-3'>Link do formulário</label>
				<div className='flex items-center space-x-3'>
					<input
						type='text'
						value={formUrl}
						readOnly
						className='flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none'
					/>
					<button
						onClick={handleCopyLink}
						className={`px-6 py-2 rounded-lg font-medium transition-all ${
							linkCopied
								? 'bg-green-100 text-green-700 border border-green-300'
								: 'bg-blue-600 text-white hover:bg-blue-700'
						}`}
					>
						{linkCopied ? (
							<>
								<Check className='h-4 w-4 mr-2 inline' />
								Copiado!
							</>
						) : (
							<>
								<Copy className='h-4 w-4 mr-2 inline' />
								Copiar
							</>
						)}
					</button>
					<a
						href={formUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-white'
					>
						Abrir
					</a>
				</div>
			</div>

			{/* Preview real */}
			<div className='bg-white border border-gray-200 rounded-lg p-6'>
				<h3 className='text-lg font-medium text-gray-900 mb-4'>Preview</h3>
				{form.isPublished ? (
					<div className='rounded-lg overflow-hidden border border-gray-200'>
						<iframe
							title='Preview do formulário (link)'
							src={`${formUrl}?embed=true&hideHeaders=true`}
							style={{ width: '100%', height: 640, border: '0' }}
						/>
					</div>
				) : (
					<div className='rounded-lg border-2 border-dashed border-gray-300 h-64 flex items-center justify-center text-center text-gray-500'>
						<p>Preview disponível apenas em formulários publicados.</p>
					</div>
				)}
			</div>
		</div>
	);

	const renderEmbedContent = () => (
		<div className='flex-1 flex'>
			{/* Main Content */}
			<div className='flex-1 pr-6'>
				<div className='mb-6'>
					<label className='block text-sm font-medium text-gray-700 mb-2'>Nome do embed</label>
					<input
						type='text'
						value={embedConfig.name}
						onChange={(e) => updateEmbedConfig({ name: e.target.value })}
						className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
					/>
				</div>

				{/* Top Bar */}
				<div className='flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg'>
					<div className='flex items-center space-x-3'>
						<button className='px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors'>
							Apply changes
						</button>
						<button
							onClick={() => setShowCodeModal(true)}
							className='p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors'
							title='Ver código'
						>
							<Code className='h-4 w-4' />
						</button>
						<button
							className='p-2 text-red-600 hover:text-red-700 hover:bg-white rounded-md transition-colors'
							title='Remover embed'
						>
							<Trash2 className='h-4 w-4' />
						</button>
					</div>
					<div className='flex items-center space-x-2'>
						<label className='text-sm text-gray-700'>Gerar via script</label>
						<input
							type='checkbox'
							checked={useScriptEmbed}
							onChange={(e) => setUseScriptEmbed(e.target.checked)}
							className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
						/>
					</div>
				</div>

				{/* Preview */}
				<div className='bg-white border border-gray-200 rounded-lg p-6 min-h-[400px]'>
					<h3 className='text-sm font-medium text-gray-700 mb-4'>Preview</h3>
					{form.isPublished ? (
						<div className='relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden min-h-[260px] flex items-center justify-center'>
							{/* Mode-specific preview */}
							{embedConfig.mode === 'card' && (
								<div className='bg-gray-50 rounded-lg shadow-inner w-full flex items-center justify-center p-4'>
									<iframe
										title='Form preview - card'
										src={embedUrl}
										style={{
											width:
												embedConfig.widthUnit === '%'
													? `${Math.min(embedConfig.width, 100)}%`
													: `${Math.min(embedConfig.width, 1000)}px`,
											height:
												embedConfig.height === 'auto'
													? 500
													: Math.min(embedConfig.heightValue, 1000),
											border: 'none',
											borderRadius: 8,
											boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
										}}
									/>
								</div>
							)}

							{embedConfig.mode === 'fullwidth' && (
								<div className='w-full bg-gray-50 rounded-lg shadow-inner p-4'>
									<iframe
										title='Form preview - fullwidth'
										src={embedUrl}
										style={{ width: '100%', height: 520, border: 'none', borderRadius: 8 }}
									/>
								</div>
							)}

							{embedConfig.mode === 'popup' && (
								<div className='w-full h-[340px] relative bg-white'>
									<div className='absolute inset-0 bg-gray-50 rounded-lg flex items-center justify-center'>
										<button
											className='shadow-md'
											style={{
												backgroundColor: embedConfig.textButton
													? 'transparent'
													: embedConfig.buttonColor,
												color: embedConfig.textButton ? embedConfig.buttonColor : '#fff',
												fontSize: `${embedConfig.fontSize}px`,
												borderRadius: `${embedConfig.borderRadius}px`,
												padding: embedConfig.textButton ? '0' : '10px 16px',
												border: 'none',
												textDecoration: embedConfig.textButton ? 'underline' : 'none',
												boxShadow: embedConfig.textButton ? 'none' : undefined,
											}}
											onClick={() => setIsPopupOpen(true)}
										>
											{embedConfig.buttonText || 'experimente'}
											{embedConfig.notificationDot && (
												<span className='inline-block ml-2 h-2 w-2 rounded-full bg-red-500 align-middle' />
											)}
										</button>
									</div>
									{isPopupOpen && (
										<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
											<div
												className='absolute inset-0 bg-black/50'
												onClick={() => setIsPopupOpen(false)}
											/>
											<div
												className='relative bg-white rounded-lg shadow-xl overflow-hidden'
												style={getPopupDimensions()}
											>
												<button
													className='absolute top-2 right-2 text-gray-400 hover:text-gray-600'
													onClick={() => setIsPopupOpen(false)}
													aria-label='Fechar'
												>
													<svg
														width='20'
														height='20'
														viewBox='0 0 24 24'
														fill='none'
														xmlns='http://www.w3.org/2000/svg'
													>
														<path
															d='M6 6L18 18'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
														/>
														<path
															d='M18 6L6 18'
															stroke='currentColor'
															strokeWidth='2'
															strokeLinecap='round'
														/>
													</svg>
												</button>
												<iframe
													title='Form popup'
													src={embedUrl}
													style={{ width: '100%', height: '100%', border: 'none' }}
												/>
											</div>
										</div>
									)}
								</div>
							)}

							{embedConfig.mode === 'sidebar' && (
								<div className='w-full h-[340px] relative bg-white'>
									<div className='absolute inset-0 bg-gray-50 rounded-lg' />
									<div
										className='absolute top-1/2 -translate-y-1/2'
										style={{
											[embedConfig.sidebarPosition === 'esquerda' ? 'left' : 'right']: '0.5rem',
										}}
									>
										<button
											className='shadow-md -rotate-90 origin-bottom-left'
											style={{
												backgroundColor: embedConfig.textButton
													? 'transparent'
													: embedConfig.buttonColor,
												color: embedConfig.textButton ? embedConfig.buttonColor : '#fff',
												fontSize: `${embedConfig.fontSize}px`,
												borderRadius: `${embedConfig.borderRadius}px`,
												padding: '10px 16px',
												border: embedConfig.textButton
													? `1px dashed ${embedConfig.buttonColor}`
													: 'none',
											}}
											onClick={() => setIsSidebarOpen((v) => !v)}
										>
											{embedConfig.buttonText || 'experimente'}
											{embedConfig.notificationDot && (
												<span className='inline-block ml-2 h-2 w-2 rounded-full bg-red-500 align-middle' />
											)}
										</button>
									</div>
									{/* Sidebar panel */}
									{isSidebarOpen && (
										<div
											className='absolute top-0 bottom-0 bg-white shadow-xl border border-gray-200'
											style={{
												width: 420,
												[embedConfig.sidebarPosition === 'esquerda' ? 'left' : 'right']: 0,
												borderRadius:
													embedConfig.sidebarPosition === 'esquerda'
														? '0 8px 8px 0'
														: '8px 0 0 8px',
											}}
										>
											<iframe
												title='Form sidebar'
												src={embedUrl}
												style={{ width: '100%', height: '100%', border: 'none' }}
											/>
										</div>
									)}
								</div>
							)}

							{embedConfig.mode === 'floating' && (
								<div className='w-full h-[340px] relative bg-white'>
									<div className='absolute inset-0 bg-gray-50 rounded-lg' />
									<button
										className='absolute bottom-6 right-6 shadow-md'
										style={{
											backgroundColor: embedConfig.buttonColor,
											color: '#fff',
											fontSize: `${embedConfig.fontSize}px`,
											borderRadius: `${embedConfig.borderRadius}px`,
											padding: '12px 16px',
										}}
										onClick={() => setIsFloatingOpen(true)}
									>
										{embedConfig.customIcon ? (
											<span className='inline-block h-4 w-4 bg-white/30 rounded' />
										) : (
											<span>Abrir</span>
										)}
										{embedConfig.notificationDot && (
											<span className='inline-block ml-2 h-2 w-2 rounded-full bg-red-500 align-middle' />
										)}
									</button>
									{isFloatingOpen && (
										<div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
											<div
												className='absolute inset-0 bg-black/50'
												onClick={() => setIsFloatingOpen(false)}
											/>
											<div
												className='relative bg-white rounded-lg shadow-xl overflow-hidden'
												style={{ width: 720, height: 560 }}
											>
												<button
													className='absolute top-2 right-2 text-gray-400 hover:text-gray-600'
													onClick={() => setIsFloatingOpen(false)}
												>
													✕
												</button>
												<iframe
													title='Form floating'
													src={embedUrl}
													style={{ width: '100%', height: '100%', border: 'none' }}
												/>
											</div>
										</div>
									)}
								</div>
							)}

							{embedConfig.mode === 'slideTab' && (
								<div className='w-full h-[340px] relative bg-white'>
									<div className='absolute inset-0 bg-gray-50 rounded-lg' />
									<div className='absolute top-1/2 -translate-y-1/2 left-0'>
										<button
											className='shadow-md'
											style={{
												backgroundColor: embedConfig.buttonColor,
												color: '#fff',
												fontSize: `${embedConfig.fontSize}px`,
												borderRadius: `${embedConfig.borderRadius}px`,
												padding: '10px 16px',
											}}
											onClick={() => setIsSlideOpen((v) => !v)}
										>
											{embedConfig.slideTabText || 'experimente'}
											{embedConfig.notificationDot && (
												<span className='inline-block ml-2 h-2 w-2 rounded-full bg-red-500 align-middle' />
											)}
										</button>
									</div>
									{isSlideOpen && (
										<div
											className='absolute top-0 bottom-0 right-0 bg-white shadow-xl border border-gray-200'
											style={{ width: 420 }}
										>
											<iframe
												title='Form slide tab'
												src={embedUrl}
												style={{ width: '100%', height: '100%', border: 'none' }}
											/>
										</div>
									)}
								</div>
							)}
						</div>
					) : (
						<div className='relative border-2 border-dashed border-gray-300 rounded-lg min-h-[260px] flex items-center justify-center text-center text-gray-500'>
							<p>Preview disponível apenas em formulários publicados.</p>
						</div>
					)}
				</div>
			</div>

			{/* Right Panel - Settings */}
			<div className='w-80 bg-gray-50 rounded-lg p-6'>
				<h3 className='text-lg font-medium text-gray-900 mb-6'>Configurações</h3>

				<div className='space-y-6'>
					{/* Mode Selector with icons */}
					<div>
						<label className='block text-sm font-medium text-gray-700 mb-3'>Modo</label>
						<details className='group relative'>
							<summary className='list-none w-full flex items-center justify-between p-3 border rounded-lg bg-white cursor-pointer'>
								<span className='flex items-center text-sm font-medium'>
									{embedConfig.mode === 'card' && (
										<Monitor className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'fullwidth' && (
										<Monitor className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'popup' && (
										<Target className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'sidebar' && (
										<Globe className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'floating' && (
										<Smartphone className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'slideTab' && (
										<Globe className='h-4 w-4 mr-2 text-gray-600' />
									)}
									{embedConfig.mode === 'card' && 'Standard'}
									{embedConfig.mode === 'fullwidth' && 'Largura total'}
									{embedConfig.mode === 'popup' && 'Popup'}
									{embedConfig.mode === 'sidebar' && 'Barra lateral'}
									{embedConfig.mode === 'floating' && 'Flutuante'}
									{embedConfig.mode === 'slideTab' && 'Guia de slide'}
								</span>
								<ChevronDown className='h-4 w-4 text-gray-500 group-open:rotate-180 transition-transform' />
							</summary>
							<div className='absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg overflow-hidden'>
								{[
									{ value: 'standard', label: 'Standard', icon: Monitor },
									{ value: 'fullwidth', label: 'Largura total', icon: Monitor },
									{ value: 'popup', label: 'Popup', icon: Target },
									{ value: 'sidebar', label: 'Barra lateral', icon: Globe },
									{ value: 'floating', label: 'Flutuante', icon: Smartphone },
									{ value: 'slideTab', label: 'Guia de slide', icon: Globe },
								].map(({ value, label, icon: Icon }) => (
									<button
										key={value}
										onClick={(e) => {
											const details = e.currentTarget.closest(
												'details'
											) as HTMLDetailsElement | null;
											if (value === 'standard') {
												applyPreset('standard');
											} else if (value === 'fullwidth') {
												applyPreset('fullwidth');
											} else {
												const modeMap: any = {
													popup: 'popup',
													sidebar: 'sidebar',
													floating: 'floating',
													slideTab: 'slideTab',
												};
												setEmbedConfig((prev) => ({ ...prev, mode: modeMap[value] }));
												setUseScriptEmbed(value === 'popup');
											}
											if (details) details.open = false;
										}}
										className='w-full flex items-center px-3 py-2 text-left text-sm hover:bg-gray-50'
									>
										<Icon className='h-4 w-4 mr-2 text-gray-600' /> {label}
									</button>
								))}
							</div>
						</details>
					</div>

					{/* Dynamic Settings by mode */}
					{embedConfig.mode === 'card' && (
						<div className='space-y-4'>
							<div className='text-sm text-gray-600'>Standard</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Altura</label>
								<input
									type='number'
									value={embedConfig.height === 'fixed' ? embedConfig.heightValue : 500}
									onChange={(e) =>
										setEmbedConfig((prev) => ({
											...prev,
											height: 'fixed',
											heightValue: parseInt(e.target.value) || 500,
										}))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									min={200}
									max={1200}
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Largura</label>
								<div className='flex items-center space-x-2'>
									<input
										type='number'
										value={embedConfig.width}
										onChange={(e) =>
											setEmbedConfig((prev) => ({
												...prev,
												width: parseInt(e.target.value) || 100,
											}))
										}
										className='flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
										min={1}
										max={embedConfig.widthUnit === '%' ? 100 : 1200}
									/>
									<select
										value={embedConfig.widthUnit}
										onChange={(e) =>
											setEmbedConfig((prev) => ({
												...prev,
												widthUnit: e.target.value as '%' | 'px',
											}))
										}
										className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									>
										<option value='%'>%</option>
										<option value='px'>px</option>
									</select>
								</div>
							</div>
							<label className='flex items-center'>
								<input
									type='checkbox'
									checked={embedConfig.fullscreenMobile}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, fullscreenMobile: e.target.checked }))
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
								<span className='ml-3 text-sm text-gray-700'>Tela cheia no mobile</span>
							</label>
						</div>
					)}

					{embedConfig.mode === 'fullwidth' && (
						<div className='text-sm text-gray-600'>
							Largura total (sem configurações adicionais)
						</div>
					)}

					{embedConfig.mode === 'popup' && (
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Tamanho do popup
								</label>
								<select
									value={embedConfig.popupSize}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, popupSize: e.target.value as any }))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
								>
									<option value='grande'>Grande</option>
									<option value='medio'>Médio</option>
									<option value='pequeno'>Pequeno</option>
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Texto do botão
								</label>
								<input
									type='text'
									value={embedConfig.buttonText}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonText: e.target.value }))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									placeholder='experimente'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Cor do botão</label>
								<input
									type='color'
									value={embedConfig.buttonColor}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonColor: e.target.value }))
									}
									className='h-10 w-16 p-1 border border-gray-300 rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Tamanho da fonte
								</label>
								<div className='flex items-center space-x-3'>
									<input
										type='range'
										min={14}
										max={32}
										value={embedConfig.fontSize}
										onChange={(e) =>
											setEmbedConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
										}
										className='flex-1'
									/>
									<input
										type='number'
										min={14}
										max={32}
										value={embedConfig.fontSize}
										onChange={(e) => {
											const v = Math.max(14, Math.min(32, parseInt(e.target.value) || 17));
											setEmbedConfig((prev) => ({ ...prev, fontSize: v }));
										}}
										className='w-16 px-2 py-1 border border-gray-300 rounded-md text-sm'
									/>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Bordas arredondadas
								</label>
								<div className='flex items-center space-x-3'>
									<input
										type='range'
										min={0}
										max={100}
										value={embedConfig.borderRadius}
										onChange={(e) =>
											setEmbedConfig((prev) => ({
												...prev,
												borderRadius: parseInt(e.target.value),
											}))
										}
										className='flex-1'
									/>
									<input
										type='number'
										min={0}
										max={100}
										value={embedConfig.borderRadius}
										onChange={(e) => {
											const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
											setEmbedConfig((prev) => ({ ...prev, borderRadius: v }));
										}}
										className='w-16 px-2 py-1 border border-gray-300 rounded-md text-sm'
									/>
								</div>
							</div>
							<label className='flex items-center'>
								<input
									type='checkbox'
									checked={embedConfig.textButton}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, textButton: e.target.checked }))
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
								<span className='ml-3 text-sm text-gray-700'>Mudar botão para texto</span>
							</label>
						</div>
					)}

					{embedConfig.mode === 'sidebar' && (
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Posição</label>
								<select
									value={embedConfig.sidebarPosition}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, sidebarPosition: e.target.value as any }))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
								>
									<option value='esquerda'>Esquerda</option>
									<option value='direita'>Direita</option>
								</select>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Texto do botão
								</label>
								<input
									type='text'
									value={embedConfig.buttonText}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonText: e.target.value }))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									placeholder='experimente'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Cor do botão</label>
								<input
									type='color'
									value={embedConfig.buttonColor}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonColor: e.target.value }))
									}
									className='h-10 w-16 p-1 border border-gray-300 rounded-md'
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Tamanho da fonte
								</label>
								<div className='flex items-center space-x-3'>
									<input
										type='range'
										min={14}
										max={32}
										value={embedConfig.fontSize}
										onChange={(e) =>
											setEmbedConfig((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))
										}
										className='flex-1'
									/>
									<input
										type='number'
										min={14}
										max={32}
										value={embedConfig.fontSize}
										onChange={(e) => {
											const v = Math.max(14, Math.min(32, parseInt(e.target.value) || 17));
											setEmbedConfig((prev) => ({ ...prev, fontSize: v }));
										}}
										className='w-16 px-2 py-1 border border-gray-300 rounded-md text-sm'
									/>
								</div>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Bordas arredondadas
								</label>
								<div className='flex items-center space-x-3'>
									<input
										type='range'
										min={0}
										max={100}
										value={embedConfig.borderRadius}
										onChange={(e) =>
											setEmbedConfig((prev) => ({
												...prev,
												borderRadius: parseInt(e.target.value),
											}))
										}
										className='flex-1'
									/>
									<input
										type='number'
										min={0}
										max={100}
										value={embedConfig.borderRadius}
										onChange={(e) => {
											const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 100));
											setEmbedConfig((prev) => ({ ...prev, borderRadius: v }));
										}}
										className='w-16 px-2 py-1 border border-gray-300 rounded-md text-sm'
									/>
								</div>
							</div>
							<label className='flex items-center'>
								<input
									type='checkbox'
									checked={embedConfig.textButton}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, textButton: e.target.checked }))
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
								<span className='ml-3 text-sm text-gray-700'>Mudar botão para texto</span>
							</label>
						</div>
					)}

					{embedConfig.mode === 'floating' && (
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Cor do botão</label>
								<input
									type='color'
									value={embedConfig.buttonColor}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonColor: e.target.value }))
									}
									className='h-10 w-16 p-1 border border-gray-300 rounded-md'
								/>
							</div>
							<button
								className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-white'
								onClick={() =>
									setEmbedConfig((prev) => ({ ...prev, customIcon: !prev.customIcon }))
								}
							>
								{embedConfig.customIcon ? 'Usar ícone padrão' : 'Usar ícone customizado'}
							</button>
							<label className='flex items-center'>
								<input
									type='checkbox'
									checked={embedConfig.notificationDot}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, notificationDot: e.target.checked }))
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
								<span className='ml-3 text-sm text-gray-700'>Ponto de notificação</span>
							</label>
						</div>
					)}

					{embedConfig.mode === 'slideTab' && (
						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>Cor do botão</label>
								<input
									type='color'
									value={embedConfig.buttonColor}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, buttonColor: e.target.value }))
									}
									className='h-10 w-16 p-1 border border-gray-300 rounded-md'
								/>
							</div>
							<button
								className='px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-white'
								onClick={() =>
									setEmbedConfig((prev) => ({ ...prev, customIcon: !prev.customIcon }))
								}
							>
								{embedConfig.customIcon ? 'Usar ícone padrão' : 'Usar ícone customizado'}
							</button>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Texto do botão (guia)
								</label>
								<input
									type='text'
									value={embedConfig.slideTabText}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, slideTabText: e.target.value }))
									}
									className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
									placeholder='experimente'
								/>
							</div>
							<label className='flex items-center'>
								<input
									type='checkbox'
									checked={embedConfig.notificationDot}
									onChange={(e) =>
										setEmbedConfig((prev) => ({ ...prev, notificationDot: e.target.checked }))
									}
									className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
								/>
								<span className='ml-3 text-sm text-gray-700'>Ponto de notificação</span>
							</label>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	const renderTargetedContent = () => (
		<div className='text-center py-12'>
			<Target className='h-12 w-12 text-gray-400 mx-auto mb-4' />
			<h3 className='text-lg font-medium text-gray-900 mb-2'>Respondentes Direcionados</h3>
			<p className='text-gray-500'>
				Funcionalidade em desenvolvimento. Em breve você poderá segmentar seus respondentes.
			</p>
		</div>
	);

	return (
		<div className='h-screen bg-gray-50 flex flex-col'>
			{/* Top navigation instead of left sidebar */}
			<div className='bg-white border-b border-gray-200'>
				<div className='max-w-7xl mx-auto px-6 py-4'>
					<div className='flex items-center justify-between'>
						<h1 className='text-lg font-semibold text-gray-900'>Compartilhar</h1>
						<div className='flex items-center gap-2'>
							<button
								onClick={() => setActiveTab('link')}
								className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
									activeTab === 'link'
										? 'bg-blue-50 text-blue-700 border-blue-200'
										: 'text-gray-700 hover:bg-gray-50 border-gray-300'
								}`}
							>
								<Link className='h-4 w-4 mr-2' /> Link
							</button>
							<button
								onClick={() => setActiveTab('embed')}
								className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
									activeTab === 'embed'
										? 'bg-blue-50 text-blue-700 border-blue-200'
										: 'text-gray-700 hover:bg-gray-50 border-gray-300'
								}`}
							>
								<Globe className='h-4 w-4 mr-2' /> Embed
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='flex-1'>
				<div className='max-w-7xl mx-auto p-8'>
					{activeTab === 'link' && renderLinkContent()}
					{activeTab === 'embed' && renderEmbedContent()}
					{activeTab === 'targeted' && renderTargetedContent()}
				</div>
			</div>

			{/* Code Modal */}
			{showCodeModal && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
					<div className='bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden'>
						<div className='p-6 border-b border-gray-200'>
							<div className='flex items-center justify-between'>
								<h3 className='text-lg font-medium text-gray-900'>Código do Embed</h3>
								<button
									onClick={() => setShowCodeModal(false)}
									className='text-gray-400 hover:text-gray-600'
								>
									✕
								</button>
							</div>
						</div>

						<div className='p-6'>
							<div className='bg-gray-900 rounded-lg p-4 mb-4'>
								<pre className='text-green-400 text-sm overflow-x-auto'>
									<code>{generateEmbedCode()}</code>
								</pre>
							</div>

							<div className='flex items-center justify-between'>
								<p className='text-sm text-gray-600'>
									Copie este código e cole no HTML da sua página
								</p>
								<button
									onClick={handleCopyCode}
									className={`px-4 py-2 rounded-lg font-medium transition-all ${
										codeCopied
											? 'bg-green-100 text-green-700 border border-green-300'
											: 'bg-blue-600 text-white hover:bg-blue-700'
									}`}
								>
									{codeCopied ? (
										<>
											<Check className='h-4 w-4 mr-2 inline' />
											Copiado!
										</>
									) : (
										<>
											<Copy className='h-4 w-4 mr-2 inline' />
											Copiar código
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
