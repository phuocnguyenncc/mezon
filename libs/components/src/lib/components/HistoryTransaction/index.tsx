import {
	fetchDetailTransaction,
	fetchListWalletLedger,
	selectCountWalletLedger,
	selectDetailedger,
	selectWalletLedger,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { formatNumber } from '@mezon/utils';
import { Pagination } from 'flowbite-react';
import { useEffect, useState } from 'react';
import TransactionDetail from '../HistoryTransaction/TransactionDetail';
import {
	API_FILTER_PARAMS,
	CURRENCY,
	DATE_FORMAT,
	EMPTY_STATES,
	FilterType,
	HEADER,
	LIMIT_WALLET,
	TAB_LABELS,
	TRANSACTION_FILTERS,
	TRANSACTION_ITEM,
	TRANSACTION_TYPES
} from './constans/constans';

interface IProps {
	onClose: () => void;
}

const HistoryTransaction = ({ onClose }: IProps) => {
	const dispatch = useAppDispatch();
	const walletLedger = useAppSelector((state) => selectWalletLedger(state));
	const detailLedger = useAppSelector((state) => selectDetailedger(state));
	const count = useAppSelector((state) => selectCountWalletLedger(state));

	const [currentPage, setCurrentPage] = useState(1);
	const [sentPage, setSentPage] = useState(1);
	const [receivedPage, setReceivedPage] = useState(1);

	const [activeFilter, setActiveFilter] = useState<FilterType>(TRANSACTION_FILTERS.ALL);
	const [openedTransactionId, setOpenedTransactionId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isDetailLoading, setIsDetailLoading] = useState(false);

	const totalPages = count === undefined ? 0 : Math.ceil(count / LIMIT_WALLET);

	const fetchTransactions = async (filter: FilterType, page: number) => {
		setIsLoading(true);
		try {
			await dispatch(
				fetchListWalletLedger({
					page,
					filter: API_FILTER_PARAMS[filter]
				})
			);
		} catch (error) {
			console.error(`Error loading transactions:`, error);
		} finally {
			setIsLoading(false);
		}
	};

	const refreshData = () => {
		fetchTransactions(activeFilter, getCurrentPage());
	};

	useEffect(() => {
		fetchTransactions(activeFilter, getCurrentPage());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeFilter, currentPage, sentPage, receivedPage]);

	const onPageChange = (page: number) => {
		if (activeFilter === TRANSACTION_FILTERS.ALL) {
			setCurrentPage(page);
		} else if (activeFilter === TRANSACTION_FILTERS.SENT) {
			setSentPage(page);
		} else if (activeFilter === TRANSACTION_FILTERS.RECEIVED) {
			setReceivedPage(page);
		}
	};

	const getCurrentPage = () => {
		if (activeFilter === TRANSACTION_FILTERS.ALL) return currentPage;
		if (activeFilter === TRANSACTION_FILTERS.SENT) return sentPage;
		return receivedPage;
	};

	const getCurrentTotalPages = () => totalPages;

	const getCurrentPageData = () => walletLedger || [];

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${day}${DATE_FORMAT.SEPARATOR}${month}${DATE_FORMAT.SEPARATOR}${year}${DATE_FORMAT.TIME_SEPARATOR}${hours}:${minutes}`;
	};

	const renderAmount = (amount: number, transactionId: string) => {
		const isOpened = openedTransactionId === transactionId;

		if (amount < 0) {
			return (
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
						{isOpened ? (
							<Icons.ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400 rotate-180" />
						) : (
							<Icons.ArrowRight className="w-4 h-4 text-red-600 dark:text-red-400" />
						)}
					</div>
					<div>
						<p className="text-red-600 dark:text-red-400 font-semibold">
							{`${formatNumber(Math.abs(amount), CURRENCY.CODE)} ${CURRENCY.SYMBOL}`}
						</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">{TRANSACTION_TYPES.SENT}</p>
					</div>
				</div>
			);
		}

		return (
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
					{isOpened ? (
						<Icons.ArrowDown className="w-4 h-4 text-green-600 dark:text-green-400 rotate-180" />
					) : (
						<Icons.ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
					)}
				</div>
				<div>
					<p className="text-green-600 dark:text-green-400 font-semibold">{`${formatNumber(amount, CURRENCY.CODE)} ${CURRENCY.SYMBOL}`}</p>
					<p className="text-xs text-gray-500 dark:text-gray-400">{TRANSACTION_TYPES.RECEIVED}</p>
				</div>
			</div>
		);
	};

	const toggleDetails = (transactionId: string) => {
		setOpenedTransactionId(openedTransactionId === transactionId ? null : transactionId);
		if (openedTransactionId !== transactionId) {
			setIsDetailLoading(true);
			dispatch(fetchDetailTransaction({ transId: transactionId })).finally(() => setIsDetailLoading(false));
		}
	};

	const getTransactionType = (amount: number) => (amount < 0 ? TRANSACTION_TYPES.SENT : TRANSACTION_TYPES.RECEIVED);

	const getStatusBadge = (amount: number) => (
		<span
			className={`px-2 py-1 text-xs font-medium rounded-full ${amount < 0
				? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
				: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
				}`}
		>
			{getTransactionType(amount)}
		</span>
	);

	const handleFilterChange = (filter: FilterType) => {
		if (activeFilter !== filter) {
			setActiveFilter(filter);
			if (filter === TRANSACTION_FILTERS.ALL) {
				setCurrentPage(1);
			} else if (filter === TRANSACTION_FILTERS.SENT) {
				setSentPage(1);
			} else if (filter === TRANSACTION_FILTERS.RECEIVED) {
				setReceivedPage(1);
			}
		}
	};

	if (!walletLedger || isLoading) {
		return (
			<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
				<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4">
					<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
						<div className="flex items-center justify-between p-6 bg-theme-surface">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
									<Icons.HistoryTransaction className="w-9 h-9 text-white" />
								</div>
								<div>
									<h4 className="text-theme-primary text-lg font-semibold">{HEADER.TITLE}</h4>
									<p className="dark:text-gray-400 text-gray-500 text-sm">{HEADER.SUBTITLE}</p>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<button
									onClick={refreshData}
									className="text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
								>
									<Icons.ReloadIcon className="w-5 h-5 " />
								</button>
								<button
									onClick={onClose}
									className="text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
								>
									<Icons.Close className="w-5 h-5 " />
								</button>
							</div>
						</div>
					</div>
					<div className=" rounded-b-xl bg-theme-surface">
						<div className="px-6 pt-4 bg-theme-surface">
							<div className="flex gap-2 mb-4 border-b dark:border-gray-700 border-gray-200 pb-4">
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.ALL)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${activeFilter === TRANSACTION_FILTERS.ALL
										? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
										: 'dark:text-gray-400 text-gray-600  hover:bg-gray-300 hover:dark:bg-gray-100 '
										}`}
								>
									{TAB_LABELS.ALL}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.SENT)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${activeFilter === TRANSACTION_FILTERS.SENT
										? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
										: 'dark:text-gray-400 text-gray-600  hover:bg-gray-300 hover:dark:bg-gray-100'
										}`}
								>
									{TAB_LABELS.SENT}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.RECEIVED)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors  ${activeFilter === TRANSACTION_FILTERS.RECEIVED
										? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
										: 'dark:text-gray-400 text-gray-600 hover:bg-gray-300 hover:dark:bg-gray-100 '
										}`}
								>
									{TAB_LABELS.RECEIVED}
								</button>
							</div>
						</div>
						<div className="px-6 pb-6 space-y-4 max-h-[450px] overflow-y-auto thread-scroll">
							{[...Array(TRANSACTION_ITEM.SKELETON_COUNT)].map((_, idx) => (
								<div
									key={idx}
									className="bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary p-4"
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 rounded-full gb-item-theme flex items-center justify-center">
												</div>
												<div>
													<div className="h-4 w-36 bg-item-theme rounded" />
													<div className="h-3 w-20 bg-item-theme rounded mt-1" />
												</div>
											</div>
											<div className="flex flex-col">
												<div className="flex items-center gap-2">
													<div className="h-5 w-24 bg-item-theme rounded" />
													<div className="h-5 w-16 bg-item-theme rounded-full" />
												</div>
												<div className="h-4 w-24 bg-item-theme rounded mt-1" />
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
						<div className="border-t dark:border-gray-700 border-gray-200 px-6 py-4 flex justify-center">
							<div className="flex gap-2">
								{[...Array(3)].map((_, idx) => (
									<div key={idx} className="w-8 h-8 rounded-lg bg-item-theme"></div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const currentData = getCurrentPageData();

	return (
		<div className="outline-none justify-center flex overflow-x-hidden items-center overflow-y-auto fixed inset-0 z-30 focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden">
			<div className="relative w-full sm:h-auto rounded-xl max-w-[800px] mx-4">
				<div className="dark:bg-bgPrimary bg-bgLightMode rounded-t-xl border-b dark:border-gray-700 border-gray-200">
					<div className="flex items-center justify-between p-6 bg-theme-surface">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 flex items-center justify-center shadow-lg">
								<Icons.HistoryTransaction className="w-9 h-9 text-white" />
							</div>
							<div>
								<h4 className="text-theme-primary text-lg font-semibold">{HEADER.TITLE}</h4>
								<p className="dark:text-gray-400 text-gray-500 text-sm">{HEADER.SUBTITLE}</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button
								onClick={refreshData}
								className="text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
							>
								<Icons.ReloadIcon className="w-5 h-5 " />
							</button>
							<button
								onClick={onClose}
								className="text-theme-primary text-theme-primary-hover transition-colors p-2 rounded-lg hover:bg-gray-500/10 "
							>
								<Icons.Close className="w-5 h-5 " />
							</button>
						</div>
					</div>
				</div>

				{walletLedger?.length ? (
					<div className=" rounded-b-xl bg-theme-surface">
						<div className="px-6 pt-4 bg-theme-surface">
							<div className="flex gap-2 mb-4 border-b dark:border-gray-700 border-gray-200 pb-4">
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.ALL)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === TRANSACTION_FILTERS.ALL
										? 'bg-blue-100 text-blue-700 '
										: 'text-theme-primary bg-item-theme-hover'
										}`}
								>
									{TAB_LABELS.ALL}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.SENT)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === TRANSACTION_FILTERS.SENT
										? 'bg-red-100 text-red-700 '
										: 'text-theme-primary bg-item-theme-hover'
										}`}
								>
									{TAB_LABELS.SENT}
								</button>
								<button
									onClick={() => handleFilterChange(TRANSACTION_FILTERS.RECEIVED)}
									className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === TRANSACTION_FILTERS.RECEIVED
										? ' bg-green-100 text-green-700 '
										: 'text-theme-primary bg-item-theme-hover'
										}`}
								>
									{TAB_LABELS.RECEIVED}
								</button>
							</div>
						</div>

						<div className="px-6 pb-6 space-y-4 max-h-[450px] overflow-y-auto thread-scroll">
							{currentData.length > 0 ? (
								<div className="space-y-4">
									{currentData.map((item, index) => (
										<div
											key={index}
											className=" bg-item-theme rounded-lg hover:shadow-lg cursor-pointer border-theme-primary"
											onClick={() => toggleDetails(item.transaction_id ?? '')}
										>
											<div className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-4">
														{renderAmount(item.value ?? 0, item.transaction_id ?? '')}
														<div className="flex flex-col">
															<div className="flex items-center gap-2">
																<p className="text-theme-primary font-medium text-sm">
																	{TRANSACTION_ITEM.ID_PREFIX}
																	{item.transaction_id?.slice(-TRANSACTION_ITEM.ID_LENGTH)}
																</p>
																{getStatusBadge(item.value ?? 0)}
															</div>
															<p className="dark:text-gray-400 text-gray-500 text-xs mt-1">
																{formatDate(item.create_time ?? '')}
															</p>
														</div>
													</div>
												</div>
											</div>

											{openedTransactionId === item.transaction_id && (
												<TransactionDetail detailLedger={detailLedger} formatDate={formatDate} isLoading={isDetailLoading} />
											)}
										</div>
									))}
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-12">
									<div className="w-16 h-16 rounded-full dark:bg-gray-700 bg-gray-100 flex items-center justify-center mb-4">
										<Icons.EmptyType />
									</div>
										<h3 className="text-theme-primary text-lg font-semibold mb-2">
										{activeFilter === TRANSACTION_FILTERS.ALL
											? EMPTY_STATES.NO_TRANSACTIONS.TITLE
											: EMPTY_STATES.NO_FILTERED_TRANSACTIONS.TITLE}
									</h3>
									<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
										{activeFilter === TRANSACTION_FILTERS.ALL
											? EMPTY_STATES.NO_TRANSACTIONS.DESCRIPTION
											: EMPTY_STATES.NO_FILTERED_TRANSACTIONS.DESCRIPTION}
									</p>
								</div>
							)}
						</div>

						{getCurrentTotalPages() > 1 && (
							<div className="border-t-theme-primary px-6 py-4 flex justify-center">
								<Pagination
									currentPage={getCurrentPage()}
									totalPages={getCurrentTotalPages()}
									onPageChange={onPageChange}
									theme={{
										pages: {
											previous: {
												base:
													'h-7 ml-0 mr-1 flex items-center justify-center rounded font-semibold border border-none px-3 py-2 text-theme-primary bg-[var(--bg-count-page)] hover:bg-[var(--bg-count-page-hover)] active:bg-[var(--bg-count-page-active)] hover:text-[var(--text-count-page-hover)] active:text-[var(--text-count-page-active)]',
												icon: 'h-5 w-5'
											},
											next: {
												base:
													'h-7 ml-1 flex items-center justify-center rounded font-semibold border border-none px-3 py-2 text-theme-primary bg-[var(--bg-count-page)] hover:bg-[var(--bg-count-page-hover)] active:bg-[var(--bg-count-page-active)] hover:text-[var(--text-count-page-hover)] active:text-[var(--text-count-page-active)]',
												icon: 'h-5 w-5'
											},
											selector: {
												base:
													'w-7 h-7 mx-1 flex items-center justify-center rounded-full font-semibold text-theme-primary bg-[var(--bg-count-page)] hover:bg-[var(--bg-count-page-hover)] active:bg-[var(--bg-count-page-active)] hover:text-[var(--text-count-page-hover)] active:text-[var(--text-count-page-active)]',
											}
										}
									}}

								/>

							</div>
						)}
					</div>
				) : (
						<div className="rounded-b-xl bg-theme-surface">
						<div className="flex flex-col items-center justify-center py-16 px-6">
							<div className="w-16 h-16 rounded-full dark:bg-gray-800 bg-gray-100 flex items-center justify-center mb-4">
								<Icons.EmptyType />
							</div>
								<h3 className="text-theme-primary text-lg font-semibold mb-2">{EMPTY_STATES.NO_TRANSACTIONS.TITLE}</h3>
							<p className="dark:text-gray-400 text-gray-500 text-sm text-center max-w-sm">
								{EMPTY_STATES.NO_TRANSACTIONS.DESCRIPTION}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default HistoryTransaction;
