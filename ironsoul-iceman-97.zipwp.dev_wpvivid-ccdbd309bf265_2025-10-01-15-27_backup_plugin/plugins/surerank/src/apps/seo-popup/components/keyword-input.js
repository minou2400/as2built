import { useSelect, useDispatch } from '@wordpress/data';
import { STORE_NAME } from '@Store/constants';
import PreviewInputWithSuffix from '@AdminComponents/preview-input-with-suffix';

const KeywordInput = () => {
	const { updatePostMetaData } = useDispatch( STORE_NAME );
	const { focusKeyword, initialized } = useSelect( ( select ) => {
		const selectors = select( STORE_NAME );
		return {
			focusKeyword: selectors?.getPostSeoMeta?.()?.focus_keyword,
			initialized: selectors.getMetaboxState(),
		};
	} );

	const handleFocusKeywordChange = ( value ) => {
		updatePostMetaData( { focus_keyword: value } );
	};

	return (
		<div className="[&>div]:w-full w-full">
			<PreviewInputWithSuffix
				value={ focusKeyword || '' }
				onChange={ handleFocusKeywordChange }
				isLoading={ ! initialized }
			/>
		</div>
	);
};

export default KeywordInput;
