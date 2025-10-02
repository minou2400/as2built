import { __ } from '@wordpress/i18n';
import { TextArea, Container, Button, toast } from '@bsf/force-ui';
import { DotIcon } from '@/global/components/icons';
import { LoaderCircle } from 'lucide-react';
import Alert from '@/global/components/alert';
import GeneratePageContent from '@/functions/page-content-generator';
import PageContentWrapper from '@/apps/admin-components/page-content-wrapper';
import withSuspense from '@/apps/admin-components/hoc/with-suspense';
import apiFetch from '@wordpress/api-fetch';
import { useState, useCallback } from '@wordpress/element';
import { ROBOTS_TXT_URL } from '@Global/constants/api';
import { cn } from '@/functions/utils';

const EDITOR_PLACEHOLDER = `# Edit your robots.txt file here to manage how search engines crawl your site

User-Agent: *
Disallow:

Sitemap: https://yourwebsite.com/sitemap_index.xml`;

const RobotsTxtEditorSettings = () => {
	const {
		robots_data = {},
		wp_reading_settings_url: wpReadingSettingsUrl = '',
	} = window?.surerank_admin_common || {};

	const {
		robots_txt_content: initialContent = '',
		search_engine_visibility: isSearchEngineEnabled = false,
		robots_file_exists: isRobotsFileExist = false,
		robot_file_content: robotsFileActualContent = '',
	} = robots_data;

	const getInitialContent = () => {
		if ( isRobotsFileExist ) {
			return robotsFileActualContent || '';
		}
		return initialContent;
	};

	const [ robotsTxtContent, setRobotsTxtContent ] = useState(
		getInitialContent()
	);
	const [ isUpdating, setIsUpdating ] = useState( false );
	const [ hasUnsavedSettings, setHasUnsavedSettings ] = useState( false );
	const cursorNotAllowed = isSearchEngineEnabled === '0' || isRobotsFileExist;
	const getAlertMessage = () => {
		if ( isRobotsFileExist ) {
			return __(
				'The contents are locked because a robots.txt file exists in the root folder. If you want to edit the contents, please delete the existing robots.txt file from your server.',
				'surerank'
			);
		}
		if ( isSearchEngineEnabled === '0' ) {
			return (
				<>
					<b>{ __( 'Warning:', 'surerank' ) }</b>{ ' ' }
					{ __(
						"Your site's search engine visibility is currently set to Hidden in ",
						'surerank'
					) }
					<a
						href={ wpReadingSettingsUrl }
						target="_blank"
						rel="noopener noreferrer"
						className="text-badge-color-sky no-underline hover:no-underline cursor-pointer bg-transparent border-none p-0 outline-none shadow-none focus:ring-0"
					>
						{ __( 'Settings > Reading', 'surerank' ) }
					</a>
					{ __(
						'. Any changes made here will not be applied until you set the search engine visibility to Public. This is required to update the robots.txt content.',
						'surerank'
					) }
				</>
			);
		}

		return (
			<>
				{ __(
					'Changes to your robots.txt file can affect how search engines crawl and index your site. Editing this file incorrectly may block important pages from search results or impact your site’s SEO. Please proceed with caution. Leave empty to let WordPress manage it. If a robots.txt file exists, delete it to use this setting. Verify the robots.txt content ',
					'surerank'
				) }
				<a
					href="https://technicalseo.com/tools/robots-txt/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-badge-color-sky no-underline hover:no-underline cursor-pointer bg-transparent border-none p-0 outline-none shadow-none focus:ring-0"
				>
					{ __( 'here.', 'surerank' ) }
				</a>
			</>
		);
	};

	// Track unsaved changes
	const handleContentChange = ( value ) => {
		setRobotsTxtContent( value );
		setHasUnsavedSettings( value !== initialContent );
	};

	// Direct update function
	const updateRobotsTxt = useCallback(
		async ( content ) => {
			if ( isUpdating ) {
				return;
			}

			setIsUpdating( true );
			try {
				const response = await apiFetch( {
					path: ROBOTS_TXT_URL,
					method: 'POST',
					data: {
						robots_txt_content: content,
					},
				} );
				if ( ! response?.success ) {
					throw new Error(
						response?.message ??
							__(
								'Failed to update robots.txt file.',
								'surerank'
							)
					);
				}
				setRobotsTxtContent( content );
				setHasUnsavedSettings( false );
				toast.success(
					__( 'Settings saved successfully.', 'surerank' )
				);
			} catch ( error ) {
				toast.error( error.message, {
					description: __(
						'An unexpected error occurred while updating the robots.txt content. Please try again later.',
						'surerank'
					),
				} );
			} finally {
				setIsUpdating( false );
			}
		},
		[ isUpdating ]
	);

	// Function to determine button icon
	const getButtonIcon = () => {
		if ( isUpdating ) {
			return <LoaderCircle className="animate-spin" />;
		}
		if ( hasUnsavedSettings ) {
			return <DotIcon />;
		}
		return null;
	};

	return (
		<Container direction="column" className="w-full gap-6">
			{ /* Code Editor */ }
			<TextArea
				value={ robotsTxtContent }
				onChange={ handleContentChange }
				rows={ 10 }
				size="md"
				disabled={ cursorNotAllowed }
				className={ cn(
					'font-mono text-sm w-full bg-background-inverse text-background-tertiary',
					cursorNotAllowed && 'cursor-not-allowed'
				) }
				placeholder={ robotsFileActualContent || EDITOR_PLACEHOLDER }
			/>

			{ /* Warning Alert */ }
			<div className="w-full">
				<Alert
					id="robots-txt-warning"
					color="warning"
					message={ getAlertMessage() }
				/>
			</div>

			{ /* Save Button with unsaved settings feedback */ }
			<div>
				<Button
					onClick={ () => updateRobotsTxt( robotsTxtContent ) }
					variant="primary"
					icon={ getButtonIcon() }
					className={ cn(
						isUpdating || ! hasUnsavedSettings
							? 'opacity-60 bg-background-brand cursor-not-allowed pointer-events-none'
							: ''
					) }
					size="md"
				>
					{ isUpdating
						? __( 'Saving…', 'surerank' )
						: __( 'Save', 'surerank' ) }
				</Button>
			</div>
		</Container>
	);
};

export const PAGE_CONTENT = [
	{
		container: null,
		content: [
			{
				id: 'robots-txt-editor-settings',
				type: 'custom',
				component: <RobotsTxtEditorSettings />,
				searchKeywords: [
					'robots.txt',
					'robots txt editor',
					'robots file',
				],
			},
		],
	},
];

const RobotsTxtEditor = () => {
	return (
		<PageContentWrapper
			title={ __( 'Robots.txt Editor', 'surerank' ) }
			description={ __(
				'Manage your robots.txt file to control what search engines can see on your website.',
				'surerank'
			) }
		>
			<GeneratePageContent
				json={ PAGE_CONTENT }
				hideGlobalSaveButton={ true }
			/>
		</PageContentWrapper>
	);
};

export default withSuspense( RobotsTxtEditor );
