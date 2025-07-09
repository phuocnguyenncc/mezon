import {
	categoriesActions,
	CategoriesEntity,
	listChannelRenderAction,
	selectAllCategories,
	selectCurrentClanId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { EDragBorderPosition, ICategoryChannel } from '@mezon/utils';
import { ApiCategoryOrderUpdate } from 'mezon-js/api.gen';
import { useRef, useState } from 'react';

const CategoryOrderSetting = () => {
	const categoryList: CategoriesEntity[] = useAppSelector(selectAllCategories);
	const currentClanId = useAppSelector(selectCurrentClanId);
	const [categoryListState, setCategoryListState] = useState<CategoriesEntity[]>(categoryList);
	const dragItemIndex = useRef<number | null>(null);
	const dragOverItemIndex = useRef<number | null>(null);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const [hasChanged, setHasChanged] = useState<boolean>(false);
	const [dragBorderPosition, setDragBorderPosition] = useState<EDragBorderPosition | null>(null);
	const dispatch = useAppDispatch();

	const handleDragStart = (index: number) => {
		dragItemIndex.current = index;
	};

	const handleDragEnter = (index: number) => {
		dragOverItemIndex.current = index;
		setHoveredIndex(index);

		if (dragItemIndex.current !== null && dragOverItemIndex.current !== null) {
			if (dragItemIndex.current > dragOverItemIndex.current) {
				setDragBorderPosition(EDragBorderPosition.TOP);
			} else if (dragItemIndex.current < dragOverItemIndex.current) {
				setDragBorderPosition(EDragBorderPosition.BOTTOM);
			}
		}
	};

	const handleDragEnd = () => {
		setDragBorderPosition(null);
		setHoveredIndex(null);

		if (dragItemIndex.current !== null && dragOverItemIndex.current !== null) {
			const copyCategoryList = [...categoryListState];
			const [draggedItem] = copyCategoryList.splice(dragItemIndex.current, 1);
			copyCategoryList.splice(dragOverItemIndex.current, 0, draggedItem);

			setCategoryListState(copyCategoryList);
			setHasChanged(true);
		}

		dragItemIndex.current = null;
		dragOverItemIndex.current = null;
	};

	const handleSave = () => {
		const listCate: ICategoryChannel[] = [];
		const categoriesOrderChanges: ApiCategoryOrderUpdate[] =
			categoryListState.map((category, index) => {
				listCate.push({
					...category,
					id: category.id,
					channels: []
				});
				return {
					category_id: category.category_id,
					order: index + 1
				};
			}) || [];

		dispatch(
			categoriesActions.updateCategoriesOrder({
				clan_id: currentClanId || '',
				categories: categoriesOrderChanges
			})
		);

		dispatch(listChannelRenderAction.sortCategoryChannel({ listCategoryOrder: listCate, clanId: currentClanId || '' }));

		setHasChanged(false);
	};

	const handleReset = () => {
		setCategoryListState(categoryList);
		setHasChanged(false);
	};

	return (
		<div className="overflow-y-auto">
			{categoryListState.map((category, index) => (
				<div
					key={category.category_id}
					className={`${index !== categoryListState.length - 1 && 'border-b'} cursor-grab bg-item-hover
					${
						hoveredIndex === index
							? dragBorderPosition === EDragBorderPosition.BOTTOM
								? 'border-b-4 border-b-green-500 dark:border-b-green-500'
								: 'border-t-4 border-t-green-500 dark:border-t-green-500'
							: ''
					}`}
					draggable
					onDragStart={() => handleDragStart(index)}
					onDragEnter={() => handleDragEnter(index)}
					onDragEnd={handleDragEnd}
				>
					<p className="p-2 truncate uppercase">{category.category_name}</p>
				</div>
			))}
			{hasChanged && (
				<div className="flex flex-row justify-end gap-[20px] mt-10">
					<button onClick={handleReset} className="rounded px-4 py-1.5 hover:underline ">
						Reset
					</button>
					<button onClick={handleSave} className="btn-primary btn-primary-hover rounded-lg px-4 py-1.5 text-nowrap ">
						Save Changes
					</button>
				</div>
			)}
		</div>
	);
};

export default CategoryOrderSetting;
