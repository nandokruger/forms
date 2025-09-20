import React, { Fragment } from 'react';
import { User } from '../types';
import { ToastProvider } from './ToastProvider';
import { Transition } from '@headlessui/react';

interface LayoutProps {
	children: React.ReactNode;
	user?: User | null;
	onNavigate?: (view: string) => void;
	currentView?: string;
	isLoading?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
	children,
	user,
	onNavigate,
	currentView,
	isLoading,
}) => {
	// Hide app chrome for embedded renders
	const search = typeof window !== 'undefined' ? window.location.search : '';
	const params = new URLSearchParams(search);
	const isEmbed = params.get('embed') === 'true' || params.get('hideHeaders') === 'true';

	if (isEmbed) {
		return (
			<ToastProvider>
				<Transition
					as='div'
					className='min-h-screen'
					appear={true}
					show={true}
					enter='transition-opacity duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
				>
					{children}
					{isLoading && (
						<div className='fixed inset-0 z-[1000] flex items-center justify-center bg-white/60'>
							<div className='h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
						</div>
					)}
				</Transition>
			</ToastProvider>
		);
	}

	if (!user) {
		return (
			<ToastProvider>
				<Transition
					as='div'
					className='min-h-screen bg-gray-50'
					appear={true}
					show={true}
					key={currentView}
					enter='transition-opacity duration-300'
					enterFrom='opacity-0'
					enterTo='opacity-100'
				>
					{children}
					{isLoading && (
						<div className='fixed inset-0 z-[1000] flex items-center justify-center bg-white/60'>
							<div className='h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
						</div>
					)}
				</Transition>
			</ToastProvider>
		);
	}

	return (
		<ToastProvider>
			<div className='min-h-screen bg-gray-50'>
				{/* Header */}
				<header className='bg-white border-b border-gray-200 sticky top-0 z-50'>
					<div className=' mx-auto px-4 sm:px-6 lg:px-8'>
						<div className='flex justify-between items-center h-16'>
							{/* Logo */}
							<div className='flex items-center'>
								<div className='flex-shrink-0'>
									<button
										onClick={() => onNavigate?.('dashboard')}
										className='flex items-center text-3xl font-semibold text-[#FF8300] hover:text-gray-600 transition-colors'
										title='Voltar para o dashboard'
									>
										{/* {'<'} */}
										<span className='font-bold'>Op</span>Form
										{/* {'>'} */}
									</button>
								</div>
							</div>

							{/* Navigation */}
							<nav className='hidden md:flex space-x-8'>
								<button
									onClick={() => onNavigate?.('dashboard')}
									className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										currentView === 'dashboard'
											? 'bg-blue-100 text-blue-700'
											: 'text-gray-500 hover:text-gray-700'
									}`}
								>
									Formulários
								</button>
								{/* <button
								onClick={() => onNavigate?.('results')}
								className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
									currentView === 'results'
										? 'bg-blue-100 text-blue-700'
										: 'text-gray-500 hover:text-gray-700'
								}`}
							>
								Results
							</button> */}
							</nav>

							{/* User Menu */}
							<div className='flex items-center space-x-4'>
								<span className='text-sm text-gray-700'>Olá, {user.name}</span>
								<button
									onClick={() => onNavigate?.('login')}
									className='text-sm text-gray-500 hover:text-gray-700'
								>
									Sair
								</button>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className='flex-1'>
					<Transition
						as='div'
						appear={true}
						show={true}
						key={currentView}
						enter='transition-all duration-300 ease-out'
						enterFrom='opacity-0 translate-y-2'
						enterTo='opacity-100 translate-y-0'
					>
						{children}
					</Transition>
				</main>

				{isLoading && (
					<div className='fixed inset-0 z-[1000] flex items-center justify-center bg-white/60'>
						<div className='h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent' />
					</div>
				)}
			</div>
		</ToastProvider>
	);
};
