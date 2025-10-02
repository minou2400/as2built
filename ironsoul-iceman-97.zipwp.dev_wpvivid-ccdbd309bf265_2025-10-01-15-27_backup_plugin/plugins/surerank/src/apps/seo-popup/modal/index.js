import { compose } from '@wordpress/compose';
import {
	useEffect,
	useCallback,
	useRef,
	Fragment,
	useMemo,
	memo,
	Suspense,
} from '@wordpress/element';
import {
	withSelect,
	withDispatch,
	useSelect,
	select as staticSelect,
} from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import { cn } from '@Functions/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Text, Toaster, toast } from '@bsf/force-ui';
import { GutenbergData, ClassicEditorData } from './dynamic-data-provider';
import { Header, Footer } from '@SeoPopup/components';
import { ArrowLeftIcon } from 'lucide-react';
import { fetchMetaSettings } from '@/functions/api';
import { SCREENS } from './screens';
import { usePageChecks } from '../hooks';

// Define toast globally for PRO plugin.
if ( window && ! window?.toast ) {
	window.toast = toast;
}

const animateVariants = {
	open: {
		x: 0,
	},
	closed: {
		x: '100%',
	},
};

export const getEditorData = () => {
	const editor = staticSelect( 'core/editor' );
	const selectors = staticSelect( STORE_NAME );
	const isBlockEditor =
		editor && typeof editor.getEditedPostContent === 'function';

	if ( isBlockEditor ) {
		return {
			postContent: editor.getEditedPostContent() || '',
			permalink: editor.getPermalink() || surerank_seo_popup?.link,
			title: editor.getEditedPostAttribute( 'title' ) || '',
			description: selectors.getPostSeoMeta()?.page_description || '',
		};
	}

	// Fallback for Classic Editor
	if (
		typeof window.tinymce !== 'undefined' &&
		window.tinymce.get( 'content' )
	) {
		const titleInput = document.getElementById( 'title' );
		return {
			postContent: window.tinymce.get( 'content' ).getContent() || '',
			permalink: surerank_seo_popup?.link,
			title: titleInput ? titleInput.value || '' : '',
			description: selectors.getPostSeoMeta()?.page_description || '',
		};
	}

	// Fallback for Classic Editor without TinyMCE (plain textarea)
	const textarea = document.getElementById( 'content' );
	const titleInput = document.getElementById( 'title' );
	return {
		postContent: textarea ? textarea.value || '' : '',
		permalink: surerank_seo_popup?.link,
		title: titleInput ? titleInput.value || '' : '',
		description: selectors.getPostSeoMeta()?.page_description || '',
	};
};

const IsolatePageChecksHook = () => {
	usePageChecks();
	return null;
};

const SeoModal = ( props ) => {
	const {
		setMetaDataAndDefaults,
		initialized,
		setInitialized,
		updateModalState,
		updateAppSettings,
		appSettings,
	} = props;

	const modalState = useSelect(
		( select ) => select( STORE_NAME ).getModalState(),
		[]
	);
	const calledOnceRef = useRef( false );

	const getSEOData = useCallback( async () => {
		if ( initialized ) {
			return;
		}

		try {
			const response = await fetchMetaSettings();
			toast.success( response.message );
			setMetaDataAndDefaults( {
				postSeoMeta: response.data,
				globalDefaults: response.global_default,
			} );
		} catch ( error ) {
			toast.error( error.message );
		} finally {
			setInitialized( true );
		}
	}, [ initialized ] );

	useEffect( () => {
		if ( ! calledOnceRef.current ) {
			getSEOData();
			calledOnceRef.current = true;
		}
	}, [ getSEOData ] );

	const closeModal = useCallback( () => {
		updateModalState( false );
	}, [ updateModalState ] );

	const RenderScreen = useMemo( () => {
		if ( appSettings?.currentScreen ) {
			return SCREENS[ appSettings?.currentScreen ].component;
		}
	}, [ appSettings?.currentScreen ] );

	const RenderHeader = useMemo( () => {
		const screen = SCREENS[ appSettings?.currentScreen ];
		if ( !! screen?.header ) {
			return screen.header;
		}

		return Header;
	}, [ appSettings?.currentScreen ] );

	const handleBack = useCallback( () => {
		const { previousScreen } = appSettings;
		if ( ! previousScreen ) {
			return;
		}
		updateAppSettings( {
			currentScreen: previousScreen,
			previousScreen: '',
		} );
	}, [ appSettings.previousScreen, updateAppSettings ] );

	return (
		<Fragment>
			<Suspense fallback={ null }>
				<IsolatePageChecksHook />
			</Suspense>
			<Toaster className="z-[100000]" />
			<AnimatePresence>
				{ modalState && (
					<motion.div
						tabIndex="0"
						id="surerank-seo-popup-modal-container"
						className="fixed inset-y-0 right-0 lg:w-slide-over-container md:w-slide-over-container w-full z-[99999] bg-background-primary shadow-2xl p-0 flex flex-col"
						initial="closed"
						animate="open"
						exit="closed"
						variants={ animateVariants }
						transition={ { duration: 0.3 } }
					>
						{ /* Header */ }
						<RenderHeader onClose={ closeModal } />
						{ /* Screen controls */ }
						{ appSettings?.previousScreen && (
							<div className="space-y-2">
								<div className="flex items-center justify-between gap-2 px-4 pt-4">
									<div>
										{ appSettings.currentScreen ===
											'checks' && (
											<Button
												onClick={ handleBack }
												variant="ghost"
												size="sm"
												icon={ <ArrowLeftIcon /> }
											>
												<Text
													size={ 14 }
													weight={ 600 }
												>
													{
														SCREENS[
															appSettings
																?.currentScreen
														]?.title
													}
												</Text>
											</Button>
										) }
									</div>
								</div>
							</div>
						) }

						{ /* Modal Body */ }
						<div
							className={ cn(
								'flex-1 flex flex-col gap-6 overflow-y-auto px-4 pt-4 pb-0',
								appSettings?.currentTab !== 'optimize' && 'pb-4'
							) }
						>
							<RenderScreen />
						</div>
						{ appSettings?.currentTab === 'optimize' && (
							<Footer onClose={ closeModal } />
						) }
					</motion.div>
				) }
			</AnimatePresence>
		</Fragment>
	);
};

let hocComponent = ( Component ) => Component;
if ( 'block' === surerank_seo_popup?.editor_type ) {
	hocComponent = GutenbergData;
} else if ( 'classic' === surerank_seo_popup?.editor_type ) {
	hocComponent = ClassicEditorData;
}

export default compose(
	withSelect( ( select ) => {
		const selectStore = select( STORE_NAME );
		return {
			initialized: selectStore.getMetaboxState(),
			appSettings: selectStore.getAppSettings(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const dispatchStore = dispatch( STORE_NAME );
		return {
			setMetaDataAndDefaults: ( value ) =>
				dispatchStore.initMetaDataAndDefaults( value ),
			setInitialized: ( value ) =>
				dispatchStore.updateMetaboxState( value ),
			updateModalState: ( value ) =>
				dispatchStore.updateModalState( value ),
			updateAppSettings: ( value ) =>
				dispatchStore.updateAppSettings( value ),
		};
	} ),
	hocComponent,
	memo
)( SeoModal );
