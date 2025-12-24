import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, DeviceEventEmitter, Keyboard, Platform, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { createStyles } from './PanelKeyboard.styles';
import AdvancedFunction from './components/AdvancedFunction';
import Gallery from './components/AttachmentPicker/Gallery';
import HeaderAttachmentPicker from './components/AttachmentPicker/HeaderAttachmentPicker';
import EmojiPicker from './components/EmojiPicker';
import type { EMessageActionType } from './enums';
import type { IMessageActionNeedToResolve } from './types';

interface IProps {
	directMessageId?: string;
	currentChannelId: string;
	currentClanId: string;
	messageAction?: EMessageActionType;
}
const PanelKeyboard = React.memo((props: IProps) => {
	const { themeValue } = useTheme();
	const [typeKeyboardBottomSheet, setTypeKeyboardBottomSheet] = useState<string>('text');
	const bottomPickerRef = useRef<BottomSheetModal>(null);
	const typeKeyboardBottomSheetRef = useRef<string>(null);
	const heightKeyboardShowRef = useRef<number>(0);
	const [heightKeyboardShow, setHeightKeyboardShow] = useState<number>(0);
	const [messageActionNeedToResolve, setMessageActionNeedToResolve] = useState<IMessageActionNeedToResolve | null>(null);
	const spacerHeightAnim = useRef(new Animated.Value(0)).current;

	const styles = useMemo(() => createStyles(themeValue), [themeValue]);

	const snapPoints = useMemo(() => {
		const height = heightKeyboardShow > 0 ? heightKeyboardShow : 1;
		const validHeight = Math.max(1, height);
		return [validHeight, Platform.OS === 'ios' ? '95%' : '100%'];
	}, [heightKeyboardShow]);

	useEffect(() => {
		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

		const showSub = Keyboard.addListener(showEvent, (e) => {
			const height = e?.endCoordinates?.height ?? 0;
			const validHeight = Math.max(0, height);
			heightKeyboardShowRef.current = validHeight;
			setHeightKeyboardShow(validHeight);
			if (
				typeKeyboardBottomSheetRef.current !== 'advanced' &&
				!!typeKeyboardBottomSheetRef?.current &&
				typeKeyboardBottomSheetRef.current !== 'emoji' &&
				typeKeyboardBottomSheetRef.current !== 'attachment'
			) {
				bottomPickerRef?.current?.dismiss();
				bottomPickerRef?.current?.close();
			}

			Animated.timing(spacerHeightAnim, {
				toValue: validHeight,
				duration: 200,
				useNativeDriver: false
			}).start();
		});

		const hideSub = Keyboard.addListener(hideEvent, () => {
			if (typeKeyboardBottomSheetRef.current !== 'text' && !!typeKeyboardBottomSheetRef?.current) {
				return;
			}
			heightKeyboardShowRef.current = 0;
			setHeightKeyboardShow(0);
			Animated.timing(spacerHeightAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: false
			}).start();
		});

		return () => {
			showSub.remove();
			hideSub.remove();
		};
	}, [spacerHeightAnim]);

	const onShowKeyboardBottomSheet = useCallback(
		async (isShow: boolean, type?: string) => {
			const keyboardHeight = heightKeyboardShowRef.current ? heightKeyboardShowRef.current : Platform.OS === 'ios' ? 365 : 300;
			const validHeight = Math.max(0, keyboardHeight);
			if (type !== 'force') {
				setTypeKeyboardBottomSheet(type);
				typeKeyboardBottomSheetRef.current = type;
			}
			if (isShow) {
				heightKeyboardShowRef.current = validHeight;
				setHeightKeyboardShow(validHeight);
				Animated.timing(spacerHeightAnim, {
					toValue: validHeight,
					duration: 200,
					useNativeDriver: false
				}).start();
				bottomPickerRef?.current?.present();
				Keyboard.dismiss();
			} else if (!isShow && typeKeyboardBottomSheetRef.current !== 'text' && (type !== 'text' || type === 'force')) {
				bottomPickerRef?.current?.dismiss();
				bottomPickerRef?.current?.close();
				Animated.timing(spacerHeightAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: false
				}).start(() => {
					heightKeyboardShowRef.current = 0;
					setHeightKeyboardShow(0);
					setTypeKeyboardBottomSheet('text');
				});
			}
		},
		[spacerHeightAnim]
	);

	useEffect(() => {
		const eventListener = DeviceEventEmitter.addListener(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, ({ isShow = false, mode = '' }) => {
			onShowKeyboardBottomSheet(isShow, mode as string);
		});

		return () => {
			eventListener.remove();
		};
	}, [onShowKeyboardBottomSheet]);

	const onClose = useCallback(
		(isFocusKeyboard = true) => {
			onShowKeyboardBottomSheet(false, 'force');
			isFocusKeyboard && DeviceEventEmitter.emit(ActionEmitEvent.SHOW_KEYBOARD, {});
		},
		[onShowKeyboardBottomSheet]
	);

	useEffect(() => {
		const showKeyboard = DeviceEventEmitter.addListener(ActionEmitEvent.SHOW_KEYBOARD, (value) => {
			setMessageActionNeedToResolve(value);
		});
		return () => {
			showKeyboard.remove();
		};
	}, []);

	const handleSheetChange = async (index: number) => {
		if (index === -1) {
			setTypeKeyboardBottomSheet('text');
			DeviceEventEmitter.emit(ActionEmitEvent.ON_PANEL_KEYBOARD_BOTTOM_SHEET, { isShow: false, mode: 'force' });
		}
	};

	return (
		<>
			<Animated.View style={[styles.spacerView, { height: spacerHeightAnim }]}>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={StyleSheet.absoluteFillObject}
				/>
			</Animated.View>
			<BottomSheetModal
				ref={bottomPickerRef}
				snapPoints={snapPoints}
				index={0}
				animateOnMount
				animationConfigs={{
					duration: 200
				}}
				handleComponent={() => (
					<View style={styles.handleIndicatorContainer}>
						<LinearGradient
							start={{ x: 1, y: 0 }}
							end={{ x: 0, y: 0 }}
							colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
							style={[StyleSheet.absoluteFillObject]}
						/>
						<View style={styles.handleIndicator} />
					</View>
				)}
				backgroundStyle={styles.backgroundBottomSheet}
				backdropComponent={null}
				enableDynamicSizing={false}
				enablePanDownToClose={true}
				onChange={handleSheetChange}
			>
				<LinearGradient
					start={{ x: 1, y: 0 }}
					end={{ x: 0, y: 0 }}
					colors={[themeValue.primary, themeValue?.primaryGradiant || themeValue.primary]}
					style={[StyleSheet.absoluteFillObject]}
				/>
				<BottomSheetScrollView
					scrollEnabled={typeKeyboardBottomSheet !== 'attachment'}
					stickyHeaderIndices={[0]}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={typeKeyboardBottomSheet === 'emoji' ? styles.scrollViewContentFlex : undefined}
				>
					{typeKeyboardBottomSheet === 'attachment' ? (
						<View>
							<HeaderAttachmentPicker
								onCancel={onClose}
								messageAction={props?.messageAction}
								currentChannelId={props?.currentChannelId}
							/>
							<Gallery currentChannelId={props?.currentChannelId} />
						</View>
					) : typeKeyboardBottomSheet === 'emoji' ? (
						<EmojiPicker
							onDone={onClose}
							bottomSheetRef={bottomPickerRef}
							directMessageId={props?.directMessageId || ''}
							messageActionNeedToResolve={messageActionNeedToResolve}
							channelId={props?.currentChannelId}
							messageAction={props?.messageAction}
						/>
					) : typeKeyboardBottomSheet === 'advanced' ? (
						<AdvancedFunction
							onClose={onClose}
							messageAction={props?.messageAction}
							directMessageId={props?.directMessageId || ''}
							currentChannelId={props?.currentChannelId}
						/>
					) : null}
				</BottomSheetScrollView>
			</BottomSheetModal>
		</>
	);
});
export default PanelKeyboard;
