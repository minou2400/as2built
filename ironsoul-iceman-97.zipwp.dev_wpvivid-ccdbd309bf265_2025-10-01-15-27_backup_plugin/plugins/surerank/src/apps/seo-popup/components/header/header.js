import { useDispatch, useSelect } from '@wordpress/data';
import { SureRankLogo } from '@/global/components/icons';
import { Button, Tabs } from '@bsf/force-ui';
import { X } from 'lucide-react';
import { STORE_NAME } from '@/store/constants';
import { TABS } from '@SeoPopup/modal/tabs';
import { cn } from '@/functions/utils';
import { createPortal, useEffect, useState } from '@wordpress/element';
import PageCheckStatusIndicator from '@AdminComponents/page-check-status-indicator';
import { usePageCheckStatus } from '@SeoPopup/hooks';

const SeoPopupTabs = () => {
	const tabs = Object.values( TABS ?? {} ).filter( ( tab ) => !! tab?.slug );

	const { updateAppSettings } = useDispatch( STORE_NAME );
	const screen = useSelect( ( select ) =>
		select( STORE_NAME ).getAppSettings()
	);

	const handleChangeTab = ( { value: { slug } } ) => {
		if ( screen?.currentTab === slug ) {
			return;
		}
		updateAppSettings( {
			currentTab: slug,
			previousTab: screen?.currentTab || '',
		} );
	};

	return (
		<Tabs.Group
			className="h-full [&_button]:h-full border-0"
			size="sm"
			variant="underline"
			activeItem={ screen?.currentTab }
			onChange={ handleChangeTab }
		>
			{ tabs.map( ( tab ) => (
				<Tabs.Tab
					className={ cn(
						'font-medium [box-shadow:none]',
						tab?.className
					) }
					key={ tab.slug }
					slug={ tab.slug }
					text={ tab.label }
					icon={ tab.icon }
				/>
			) ) }
		</Tabs.Group>
	);
};

const PageChecksStatus = () => {
	const [ host, setHost ] = useState( null );
	const { status, initializing, counts } = usePageCheckStatus();

	useEffect( () => {
		const hostElement = document.querySelector(
			'.surerank-page-checks-indicator'
		);
		if ( ! hostElement ) {
			return;
		}
		setHost( hostElement );
	}, [] );

	return (
		host &&
		createPortal(
			<PageCheckStatusIndicator
				status={ status }
				errorAndWarnings={ counts.errorAndWarnings }
				initializing={ initializing }
				className="static ml-1 size-1.5"
			/>,
			host
		)
	);
};

const Header = ( { onClose } ) => {
	return (
		<div className="flex items-center justify-between gap-3 border-0 border-b-0.5 border-solid border-border-subtle">
			<div className="flex items-center py-3.5 px-4">
				<SureRankLogo width={ 32 } height={ 20 } />
			</div>
			<div className="h-full flex items-center mr-auto gap-2">
				<SeoPopupTabs />
			</div>
			<div className="flex items-center py-3.5 px-4 gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={ onClose }
					className="p-1 text-icon-secondary hover:text-icon-primary hover:bg-transparent bg-transparent focus:outline-none"
					icon={ <X /> }
				/>
			</div>
			<PageChecksStatus />
		</div>
	);
};

export default Header;
