import { selectShowModelDetailEvent } from '@mezon/store';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';
import ModalCreate from './ModalCreate';
import ModalDetailItemEvent from './ModalCreate/modalDetailItemEvent';
import { StartEventModal } from './StartEvent';

export type EventModalProps = {
	onClose: () => void;
};

const EventModal = (props: EventModalProps) => {
	const { onClose } = props;
	const [openModal, setOpenModal] = useState(false);
	const [eventUpdateId, setEventUpdatedId] = useState<string>('');
	const showModalDetailEvent = useSelector(selectShowModelDetailEvent);

	const onEventUpdateId = (id: string) => {
		setEventUpdatedId(id);
	};

	const clearEventId = () => {
		setEventUpdatedId('');
	};
	useEffect(() => {
		setEventUpdatedId(eventUpdateId || '');
	}, [eventUpdateId]);
	return (
		<ModalLayout onClose={onClose}>
			<div className={`relative w-full sm:h-auto rounded-lg ${openModal ? 'max-w-[472px]' : 'max-w-[600px]'}`}>
				{!openModal ? (
					<div className="rounded-lg text-sm overflow-hidden bg-theme-setting-primary text-theme-primary">
						<StartEventModal onClose={onClose} onOpenCreate={() => setOpenModal(true)} onEventUpdateId={onEventUpdateId} />
					</div>
				) : (
					<div className="rounded-lg text-sm">
						<ModalCreate
							onClose={() => setOpenModal(false)}
							onCloseEventModal={onClose}
							eventId={eventUpdateId}
							clearEventId={clearEventId}
						/>
					</div>
				)}
			</div>
			{showModalDetailEvent && <ModalDetailItemEvent />}
		</ModalLayout>
	);
};

export default EventModal;
