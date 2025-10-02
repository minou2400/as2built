import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import {
	INPUT_VARIABLE_SUGGESTIONS as variableSuggestions,
	DESCRIPTION_LENGTH,
	TITLE_LENGTH,
	MAX_EDITOR_INPUT_LENGTH,
} from '@Global/constants';
import { useMemo, useRef } from '@wordpress/element';
import { Label, EditorInput } from '@bsf/force-ui';
import { Info } from 'lucide-react';
import { SeoPopupTooltip } from '@AdminComponents/tooltip';
import {
	editorValueToString,
	stringValueToFormatJSON,
	truncateText,
	cn,
	urlToBreadcrumbFormat,
} from '@Functions/utils';
import Preview from '@GlobalComponents/preview';
import replacement from '@Functions/replacement';
import { flat } from '@Functions/variables';
import usePostPermalink from '@/global/hooks/use-post-permalink';

const GeneralTab = ( { postMetaData, updatePostMetaData, globalDefaults } ) => {
	const { variables, postDynamicData, title, description } = useSelect(
		( select ) => {
			const selectors = select( STORE_NAME );
			return {
				variables: selectors?.getVariables(),
				postDynamicData: selectors?.getPostDynamicData(),
				title: selectors?.getPostSeoMeta()?.page_title,
				description: selectors?.getPostSeoMeta()?.page_description,
			};
		},
		[]
	);
	const defaultGlobalMeta = globalDefaults;

	const titleEditor = useRef( null );
	const descriptionEditor = useRef( null );

	const handleUpdatePostMetaData = ( key, value ) => {
		// if value is same as previous value, return
		if ( postMetaData[ key ] === value ) {
			return;
		}
		updatePostMetaData( {
			[ key ]: value,
		} );
	};

	const variablesArray = flat( variables );
	const faviconImageUrl = surerank_seo_popup?.site_icon_url
		? surerank_seo_popup?.site_icon_url
		: '';
	const titleContent = replacement(
		title || defaultGlobalMeta.page_title,
		variablesArray,
		postDynamicData
	);
	const descriptionContent = replacement(
		description || defaultGlobalMeta?.page_description,
		variablesArray,
		postDynamicData
	);
	const titleContentTruncated = truncateText( titleContent, TITLE_LENGTH );
	const descriptionContentTruncated = truncateText(
		descriptionContent,
		DESCRIPTION_LENGTH
	);

	const inputTitleContent = replacement(
		title,
		variablesArray,
		postDynamicData
	);
	const inputDescriptionContent = replacement(
		description,
		variablesArray,
		postDynamicData
	);

	const dynamicPermalink = usePostPermalink();
	const currentPermalink = useMemo( () => {
		if (
			/page_id=|p=/.test( variablesArray?.permalink ) &&
			dynamicPermalink
		) {
			return dynamicPermalink;
		}
		return variablesArray?.permalink;
	}, [ variablesArray?.permalink, dynamicPermalink ] );

	return (
		<div className="flex flex-col gap-2">
			{ /* Search Engine Preview */ }
			<div className="space-y-2.5 p-2 px-0">
				<div className="flex items-center justify-between gap-10">
					<div className="flex items-center justify-start gap-1">
						<Label tag="span" size="sm" className="space-x-0.5">
							<span>
								{ __( 'Search Engine Preview', 'surerank' ) }
							</span>
						</Label>
						<SeoPopupTooltip
							content={ __(
								'View a preview of how your page may appear in search engine results. This preview is for guidance only and might not exactly match how search engines display your content.',
								'surerank'
							) }
							placement="top"
							arrow
							className="z-[99999]"
						>
							<Info className="size-4 text-icon-secondary" />
						</SeoPopupTooltip>
					</div>
				</div>

				<Preview
					siteTitle={ variablesArray?.site_name }
					faviconURL={ faviconImageUrl }
					title={ titleContentTruncated }
					description={ descriptionContentTruncated }
					permalink={ urlToBreadcrumbFormat( currentPermalink, 65 ) }
					deviceType={ 'desktop' }
				/>
			</div>

			{ /* Search Engine Title input */ }
			<div className="space-y-1.5 p-2">
				{ /* Label & Limit */ }
				<div className="flex items-center justify-start gap-1">
					<Label tag="span" size="sm" className="space-x-0.5">
						<span>{ __( 'Search Engine Title', 'surerank' ) }</span>
					</Label>
					<span className="text-xs leading-4 font-normal text-field-helper">
						<span
							className={ cn( {
								'text-text-error':
									inputTitleContent?.length > TITLE_LENGTH,
							} ) }
						>
							{ inputTitleContent?.length ?? 0 }
						</span>
						/ { TITLE_LENGTH }
					</span>
				</div>
				{ /* Input */ }
				<EditorInput
					key="title"
					ref={ titleEditor }
					by="label"
					defaultValue={ stringValueToFormatJSON(
						postMetaData.page_title || defaultGlobalMeta.page_title,
						variableSuggestions,
						'value'
					) }
					trigger="@"
					options={ variableSuggestions }
					onChange={ ( editorState ) => {
						handleUpdatePostMetaData(
							'page_title',
							editorValueToString( editorState.toJSON() )
						);
					} }
					placeholder={ '' }
				/>
				{ /* Hint text */ }
				<span className="block text-xs leading-4 font-normal text-field-helper">
					{ __( 'Type @ to view variable suggestions', 'surerank' ) }
				</span>
			</div>

			{ /* Search Engine Description input */ }
			<div className="space-y-1.5 p-2">
				{ /* Label & Limit */ }
				<div className="flex items-center justify-start gap-1">
					<Label tag="span" size="sm" className="space-x-0.5">
						<span>
							{ __( 'Search Engine Description', 'surerank' ) }
						</span>
					</Label>
					<span className="text-xs leading-4 font-normal text-field-helper">
						<span
							className={ cn( {
								'text-text-error':
									inputDescriptionContent?.length >
									DESCRIPTION_LENGTH,
							} ) }
						>
							{ inputDescriptionContent?.length ?? 0 }
						</span>
						/{ DESCRIPTION_LENGTH }
					</span>
				</div>
				{ /* Input */ }
				<EditorInput
					ref={ descriptionEditor }
					className="[&+div]:items-start [&+div]:pt-1"
					by="label"
					trigger="@"
					defaultValue={ stringValueToFormatJSON(
						postMetaData?.page_description ||
							defaultGlobalMeta?.page_description,
						variableSuggestions,
						'value'
					) }
					options={ variableSuggestions }
					onChange={ ( editorState ) => {
						handleUpdatePostMetaData(
							'page_description',
							editorValueToString( editorState.toJSON() )
						);
					} }
					placeholder={ '' }
					maxLength={ MAX_EDITOR_INPUT_LENGTH }
				/>
				{ /* Hint text */ }
				<span className="block text-xs leading-4 font-normal text-field-helper">
					{ __( 'Type @ to view variable suggestions', 'surerank' ) }
				</span>
			</div>
		</div>
	);
};

export default GeneralTab;
