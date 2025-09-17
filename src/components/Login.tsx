import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';

interface LoginProps {
	onLogin: (email: string, password: string, name: string | undefined, isSignup: boolean) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
	const [isSignup, setIsSignup] = useState(true);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onLogin(email, password, name || undefined, isSignup);
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
			<div className='max-w-md w-full space-y-8'>
				<div className='text-center'>
					<h1 className='text-4xl font-bold text-blue-600 mb-2'>FormBuilder</h1>
					<h2 className='text-3xl font-bold text-gray-900'>
						{isSignup ? 'Criar conta' : 'Entrar'}
					</h2>
					<p className='mt-2 text-sm text-gray-600'>
						{isSignup
							? 'Crie sua conta para começar a criar formulários'
							: 'Entre na sua conta para continuar'}
					</p>
				</div>

				<form className='mt-8 space-y-6' onSubmit={handleSubmit}>
					<div className='space-y-4'>
						{isSignup && (
							<div>
								<label htmlFor='name' className='block text-sm font-medium text-gray-700'>
									Nome completo
								</label>
								<div className='mt-1 relative'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<User className='h-5 w-5 text-gray-400' />
									</div>
									<input
										id='name'
										name='name'
										type='text'
										required={isSignup}
										value={name}
										onChange={(e) => setName(e.target.value)}
										className='appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
										placeholder='Seu nome'
									/>
								</div>
							</div>
						)}

						<div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-700'>
								E-mail
							</label>
							<div className='mt-1 relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='email'
									name='email'
									type='email'
									autoComplete='email'
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className='appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
									placeholder='seu@email.com'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-700'>
								Senha
							</label>
							<div className='mt-1 relative'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' />
								</div>
								<input
									id='password'
									name='password'
									type='password'
									autoComplete='current-password'
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className='appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
									placeholder='Sua senha'
								/>
							</div>
						</div>
					</div>

					<div>
						<button
							type='submit'
							className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
						>
							{isSignup ? 'Criar conta' : 'Entrar'}
						</button>
					</div>

					<div className='text-center'>
						<button
							type='button'
							onClick={() => setIsSignup(!isSignup)}
							className='text-sm text-blue-600 hover:text-blue-500'
						>
							{isSignup ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Crie uma aqui'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
