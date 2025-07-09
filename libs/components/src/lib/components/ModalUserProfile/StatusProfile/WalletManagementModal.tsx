import { ButtonCopy } from '@mezon/components';
import { accountActions, selectAllAccount, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import * as bip39 from 'bip39';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

interface WalletManagementModalProps {
	isOpen: boolean;
	onClose: () => void;
}

class WalletCrypto {
	// Derive key from passcode using PBKDF2
	static async deriveKey(passcode: string, salt: Uint8Array): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(passcode), { name: 'PBKDF2' }, false, ['deriveKey']);

		return crypto.subtle.deriveKey(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			{ name: 'AES-GCM', length: 256 },
			false,
			['encrypt', 'decrypt']
		);
	}

	// Encrypt private key with passcode
	static async encryptPrivateKey(privateKey: string, passcode: string): Promise<{ encryptedData: string; salt: string; iv: string }> {
		const salt = crypto.getRandomValues(new Uint8Array(16));
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const key = await this.deriveKey(passcode, salt);

		const encoder = new TextEncoder();
		const data = encoder.encode(privateKey);

		const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);

		return {
			encryptedData: Array.from(new Uint8Array(encryptedBuffer), (byte) => byte.toString(16).padStart(2, '0')).join(''),
			salt: Array.from(salt, (byte) => byte.toString(16).padStart(2, '0')).join(''),
			iv: Array.from(iv, (byte) => byte.toString(16).padStart(2, '0')).join('')
		};
	}

	static async decryptPrivateKey(encryptedData: string, salt: string, iv: string, passcode: string): Promise<string> {
		const saltArray = new Uint8Array(salt.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
		const ivArray = new Uint8Array(iv.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
		const encryptedArray = new Uint8Array(encryptedData.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));

		const key = await this.deriveKey(passcode, saltArray);

		const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArray }, key, encryptedArray);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedBuffer);
	}
}

class WalletStorage {
	private static dbName = 'MezonWallet';
	private static version = 1;
	private static storeName = 'wallets';

	static async openDB(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: 'userId' });
				}
			};
		});
	}

	static async saveEncryptedWallet(userId: string, encryptedWallet: any): Promise<void> {
		const db = await this.openDB();
		const transaction = db.transaction([this.storeName], 'readwrite');
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.put({ userId, ...encryptedWallet, timestamp: Date.now() });
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	}

	static async getEncryptedWallet(userId: string): Promise<any> {
		const db = await this.openDB();
		const transaction = db.transaction([this.storeName], 'readonly');
		const store = transaction.objectStore(this.storeName);

		return new Promise((resolve, reject) => {
			const request = store.get(userId);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
		});
	}
}

export const WalletIcon = () => (
	<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
		<path d="M17 7H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-8a3 3 0 0 0-3-3zM6 9h11a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zm11-2H7V6a2 2 0 0 1 4 0h2a4 4 0 0 0-8 0v1H5a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2z" />
		<circle cx="15" cy="13" r="1" />
	</svg>
);

const WalletManagementModal: React.FC<WalletManagementModalProps> = ({ isOpen, onClose }) => {
	const dispatch = useAppDispatch();
	const userProfile = useSelector(selectAllAccount);
	const [walletData, setWalletData] = useState({
		address: '',
		privateKey: '',
		recoveryPhrase: '',
		showPrivateKey: false,
		showRecoveryPhrase: false,
		isEncrypted: false
	});
	const [showPinModal, setShowPinModal] = useState<{
		isOpen: boolean;
		type: 'privateKey' | 'recoveryPhrase' | 'setup' | '';
	}>({ isOpen: false, type: '' });
	const [pin, setPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [isSettingUpPin, setIsSettingUpPin] = useState(false);

	useEffect(() => {
		loadWalletData();
	}, [userProfile]);

	const loadWalletData = async () => {
		if (!userProfile?.user?.id) return;

		try {
			const encryptedWallet = await WalletStorage.getEncryptedWallet(userProfile.user.id);

			if (encryptedWallet) {
				setWalletData((prev) => ({
					...prev,
					address: encryptedWallet.address || '',
					isEncrypted: true
				}));
			} else {
				if (userProfile?.user?.metadata) {
					try {
						const metadata = JSON.parse(userProfile.user.metadata);
						if (metadata.wallet) {
							setWalletData((prev) => ({
								...prev,
								address: metadata.wallet.address || '',
								privateKey: metadata.wallet.privateKey || '',
								recoveryPhrase: metadata.wallet.recoveryPhrase || '',
								isEncrypted: false
							}));
						}
					} catch (error) {
						console.error('Error parsing wallet metadata:', error);
					}
				}
			}
		} catch (error) {
			console.error('Error loading wallet data:', error);
		}
	};

	const validateMnemonic = (mnemonic: string): boolean => {
		return bip39.validateMnemonic(mnemonic);
	};

	const generateWallet = async () => {
		try {
			const mnemonic = bip39.generateMnemonic(128);

			if (!validateMnemonic(mnemonic)) {
				throw new Error('Generated mnemonic failed validation');
			}

			const recoveryPhrase = mnemonic;

			const seed = bip39.mnemonicToSeedSync(mnemonic);
			const privateKey = seed.slice(0, 32).toString('hex');

			const addressArray = crypto.getRandomValues(new Uint8Array(20));
			const address = '0x' + Array.from(addressArray, (byte) => byte.toString(16).padStart(2, '0')).join('');

			setIsSettingUpPin(true);
			setShowPinModal({ isOpen: true, type: 'setup' });

			setWalletData((prev) => ({
				...prev,
				address,
				privateKey,
				recoveryPhrase
			}));
		} catch (error) {
			console.error('Error generating wallet:', error);
		}
	};

	const saveEncryptedWallet = async (passcode: string) => {
		if (!userProfile?.user?.id || !walletData.privateKey) return;

		try {
			const encryptedPrivateKey = await WalletCrypto.encryptPrivateKey(walletData.privateKey, passcode);
			const encryptedRecoveryPhrase = await WalletCrypto.encryptPrivateKey(walletData.recoveryPhrase, passcode);

			const encryptedWallet = {
				address: walletData.address,
				encryptedPrivateKey,
				encryptedRecoveryPhrase,
				createdAt: new Date().toISOString()
			};

			await WalletStorage.saveEncryptedWallet(userProfile.user.id, encryptedWallet);

			const publicWalletInfo = {
				address: walletData.address,
				createdAt: new Date().toISOString()
			};
			dispatch(accountActions.setWalletMetadata(publicWalletInfo));

			setWalletData((prev) => ({ ...prev, isEncrypted: true }));
		} catch (error) {
			console.error('Error saving encrypted wallet:', error);
		}
	};

	const decryptAndShow = async (type: 'privateKey' | 'recoveryPhrase', passcode: string) => {
		if (!userProfile?.user?.id) return;

		try {
			const encryptedWallet = await WalletStorage.getEncryptedWallet(userProfile.user.id);
			if (!encryptedWallet) return;

			if (type === 'privateKey') {
				const { encryptedData, salt, iv } = encryptedWallet.encryptedPrivateKey;
				const decryptedPrivateKey = await WalletCrypto.decryptPrivateKey(encryptedData, salt, iv, passcode);
				setWalletData((prev) => ({
					...prev,
					privateKey: decryptedPrivateKey,
					showPrivateKey: true
				}));
			} else {
				const { encryptedData, salt, iv } = encryptedWallet.encryptedRecoveryPhrase;
				const decryptedRecoveryPhrase = await WalletCrypto.decryptPrivateKey(encryptedData, salt, iv, passcode);
				setWalletData((prev) => ({
					...prev,
					recoveryPhrase: decryptedRecoveryPhrase,
					showRecoveryPhrase: true
				}));
			}
		} catch (error) {
			console.error('Error decrypting wallet data:', error);
			toast.error('Incorrect passcode or corrupted data');
		}
	};

	const handlePinVerification = (type: 'privateKey' | 'recoveryPhrase') => {
		setShowPinModal({ isOpen: true, type });
	};

	const handlePinConfirm = async () => {
		if (showPinModal.type === 'setup') {
			if (pin.length === 6 && confirmPin.length === 6) {
				if (pin === confirmPin) {
					await saveEncryptedWallet(pin);
					setShowPinModal({ isOpen: false, type: '' });
					setPin('');
					setConfirmPin('');
					setIsSettingUpPin(false);
				} else {
					toast.error('PINs do not match');
				}
			}
		} else {
			if (pin.length === 6) {
				await decryptAndShow(showPinModal.type as 'privateKey' | 'recoveryPhrase', pin);
				setShowPinModal({ isOpen: false, type: '' });
				setPin('');
			}
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-theme-primary">
			<div className="thread-scroll bg-theme-setting-primary rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-xl font-semibold ">Blockchain Wallet Management</h2>
					<button onClick={onClose} className="text-theme-primary-hover">
						<Icons.CloseIcon className="w-6 h-6" />
					</button>
				</div>

				{!walletData.address ? (
					<div className="text-center py-8">
						<div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center bg-item-theme">
							<WalletIcon />
						</div>
						<p className="mb-6">No wallet found</p>
						<button
							onClick={generateWallet}
							className="btn-primary btn-primary-hover hover:bg-buttonPrimaryHover  px-6 py-3 rounded-lg text-sm font-medium inline-flex items-center gap-2"
						>
							<WalletIcon />
							Generate New Wallet (BIP39 Standard)
						</button>
					</div>
				) : (
					<div className="space-y-6">
						<div className="flex items-center gap-2 text-sm">
							<Icons.LockIcon className="w-4 h-4 text-green-500" />
							<span className="text-green-600 dark:text-green-400">
								{walletData.isEncrypted ? 'Encrypted & Secure' : 'Legacy Storage (Upgrade Recommended)'}
							</span>
						</div>

						<div>
							<label className="block text-sm font-medium  mb-2">Wallet Address</label>
							<div className="flex items-center gap-3 p-3 border rounded-lg ">
								<span className="text-sm font-mono truncate flex-1 ">{walletData.address}</span>
								<ButtonCopy copyText={walletData.address} className="p-2  rounded-md text-sm" title="Copy address" />
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium  mb-2">Private Key</label>
							{walletData.showPrivateKey ? (
								<div className="space-y-3">
									<div className="p-3 border rounded-lg ">
										<span className="text-xs font-mono break-all ">{walletData.privateKey}</span>
									</div>
									<div className="flex gap-2">
										<ButtonCopy
											copyText={walletData.privateKey}
											className="flex-1 py-2 px-4 border-theme-primary text-theme-primary hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
											title="Copy to clipboard"
										/>

										<button
											onClick={() => setWalletData((prev) => ({ ...prev, showPrivateKey: false, privateKey: '' }))}
											className="py-2 px-4 border-theme-primary bg-secondary-button-hover text-theme-primary-hover rounded-lg text-sm  inline-flex items-center gap-2"
										>
											<Icons.EyeClose className="w-4 h-4" />
											Hide
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => handlePinVerification('privateKey')}
									className="w-full py-3 px-4 border-2 border-dashed  rounded-lg hover:border-blue-500  transition-colors inline-flex items-center justify-center gap-2"
								>
									<Icons.EyeOpen className="w-4 h-4" />
									<span className="text-blue-500  font-medium">Show private key</span>
								</button>
							)}
						</div>

						<div>
							<label className="block text-sm font-medium  mb-2">Secret Recovery Phrase</label>
							{walletData.showRecoveryPhrase ? (
								<div className="space-y-3">
									<div className="p-3 border ">
										<div className="grid grid-cols-3 gap-2">
											{walletData.recoveryPhrase.split(' ').map((word, index) => (
												<div key={index} className="text-xs font-mono p-2 rounded border text-center">
													<span className="text-[10px]">{index + 1}</span>
													<div className="">{word}</div>
												</div>
											))}
										</div>
									</div>
									<div className="flex gap-2">
										<ButtonCopy
											copyText={walletData.recoveryPhrase}
												className="flex-1 py-2 px-4 btn-primary btn-primary-hover rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
											title="Copy to clipboard"
										/>

										<button
											onClick={() => setWalletData((prev) => ({ ...prev, showRecoveryPhrase: false, recoveryPhrase: '' }))}
											className="py-2 px-4 border  rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 inline-flex items-center gap-2"
										>
											<Icons.EyeClose className="w-4 h-4" />
											Hide
										</button>
									</div>
								</div>
							) : (
								<button
									onClick={() => handlePinVerification('recoveryPhrase')}
									className="w-full py-3 px-4 border-2 border-dashed  rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors inline-flex items-center justify-center gap-2"
								>
									<Icons.EyeOpen className="w-4 h-4" />
									<span className="text-blue-500 dark:text-blue-400 font-medium">Show recovery phrase</span>
								</button>
							)}
						</div>

						<div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
							<div className="flex items-start gap-3">
								<Icons.InfoIcon className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
								<div>
										<p className="font-bold text-theme-primary mb-2">
										DO NOT share your private key or recovery phrase!
									</p>
										<ul className="text-theme-primary text-sm space-y-1">
										<li>• These give full access to your wallet and funds</li>
										<li>• Mezon will never ask for your private key</li>
										<li>• Private keys are encrypted and stored locally</li>
										<li>• Store recovery phrase safely offline</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				)}

				{showPinModal.isOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
						<div className="bg-theme-setting-primary rounded-lg shadow-xl p-6 w-85">
							<div className="flex items-center gap-3 mb-4">
								<Icons.LockIcon className="w-6 h-6" />
								<h3 className="text-lg font-semibold ">
									{showPinModal.type === 'setup' ? 'Set Up Security PIN' : 'Security Verification'}
								</h3>
							</div>

							{showPinModal.type === 'setup' ? (
								<div>
									<p className=" mb-4">Create a 6-digit PIN to encrypt your wallet like MetaMask</p>
									<input
										type="password"
										maxLength={6}
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
										placeholder="••••••"
										autoFocus
									/>
									<input
										type="password"
										maxLength={6}
										value={confirmPin}
										onChange={(e) => setConfirmPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Confirm PIN"
									/>
									<p className="text-xs mt-2 text-center">This PIN will encrypt your private key and recovery phrase</p>
								</div>
							) : (
								<div>
									<p className=" mb-6">
										Enter your 6-digit PIN to decrypt and view{' '}
										{showPinModal.type === 'privateKey' ? 'private key' : 'recovery phrase'}
									</p>
									<input
										type="password"
										maxLength={6}
										value={pin}
										onChange={(e) => setPin(e.target.value)}
										className="w-full p-3 border-theme-primary rounded-lg text-center text-lg font-mono bg-theme-input focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="••••••"
										autoFocus
									/>
									<p className="text-xs mt-2 text-center">Data is encrypted and stored securely in local</p>
								</div>
							)}

							<div className="flex gap-3 mt-6">
								<button
									onClick={() => {
										setShowPinModal({ isOpen: false, type: '' });
										setPin('');
										setConfirmPin('');
										setIsSettingUpPin(false);
									}}
									className="flex-1 py-2 px-4 border-theme-primary rounded-lg text-sm bg-secondary-button-hover "
								>
									Cancel
								</button>
								<button
									onClick={handlePinConfirm}
									disabled={showPinModal.type === 'setup' ? pin.length !== 6 || confirmPin.length !== 6 : pin.length !== 6}
									className="flex-1 py-2 px-4 btn-primary btn-primary-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium inline-flex items-center justify-center gap-2"
								>
									<Icons.LockIcon className="w-4 h-4" />
									{showPinModal.type === 'setup' ? 'Encrypt Wallet' : 'Decrypt & Show'}
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default WalletManagementModal;
