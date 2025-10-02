import { useState, useLayoutEffect, useRef, useCallback } from '@wordpress/element';
import { useSelect, subscribe } from '@wordpress/data';
import { debounce, isEqual } from 'lodash';
import { STORE_NAME } from '@Store/constants';
import replacement from '@Functions/replacement';
import { flat } from '@Functions/variables';
import { getEditorData } from '@SeoPopup/modal';
import {
	checkKeywordInTitle,
	checkKeywordInDescription,
	checkKeywordInUrl,
	checkKeywordInContent,
} from '../analyzer/keyword-analyzer';

export const useKeywordChecks = ( { focusKeyword, ignoredList = [] } ) => {
	const {
		metaData,
		variables,
		postDynamicData,
		globalDefaults,
		settingsLoaded,
	} = useSelect( ( select ) => {
		const selectors = select( STORE_NAME );
		return {
			metaData: selectors?.getPostSeoMeta(),
			variables: selectors?.getVariables(),
			postDynamicData: selectors?.getPostDynamicData(),
			globalDefaults: selectors?.getGlobalDefaults(),
			settingsLoaded: selectors?.getMetaboxState(),
		};
	}, [] );

	const [ checks, setChecks ] = useState( {
		badChecks: [],
		fairChecks: [],
		passedChecks: [],
		suggestionChecks: [],
		ignoredChecks: [],
		hasBadOrFairChecks: false,
	} );
	const lastSnapshot = useRef( { postContent: '', permalink: '' } );
	const lastMeta = useRef( metaData );
	const lastKeyword = useRef( focusKeyword );
	const lastIgnoredList = useRef( ignoredList );

	const runKeywordChecks = useCallback( ( snapshot, seoMeta, keyword ) => {
		if ( ! keyword ) {
			setChecks( {
				badChecks: [],
				fairChecks: [],
				passedChecks: [],
				suggestionChecks: [],
				ignoredChecks: [],
				hasBadOrFairChecks: false,
			} );
			return;
		}

		// variables array.
		const variablesArray = flat( variables );

		// title.
		const resolvedTitle = replacement(
			seoMeta.page_title || globalDefaults.page_title || '',
			variablesArray,
			postDynamicData
		);

		// description.
		const resolvedDescription = replacement(
			seoMeta.page_description || globalDefaults.page_description || '',
			variablesArray,
			postDynamicData
		);

		// permalink.
		const resolvedUrl =
			snapshot?.permalink ||
			variables?.post?.permalink?.value ||
			variables?.term?.permalink?.value ||
			window.location.href ||
			'';

		// content.
		const resolvedContent =
			snapshot?.postContent || postDynamicData?.content || '';

		const rawChecks = [];
		rawChecks.push( checkKeywordInTitle( resolvedTitle, keyword ) );
		rawChecks.push(
			checkKeywordInDescription( resolvedDescription, keyword )
		);
		rawChecks.push( checkKeywordInUrl( resolvedUrl, keyword ) );
		rawChecks.push( checkKeywordInContent( resolvedContent, keyword ) );

		// Categorize checks
		const categories = {
			badChecks: [],
			fairChecks: [],
			passedChecks: [],
			suggestionChecks: [],
			ignoredChecks: [],
		};

		rawChecks.forEach( ( check ) => {
			// Check if this check is ignored
			if ( ignoredList.includes( check.id ) ) {
				categories.ignoredChecks.push( { ...check, ignore: true } );
				return;
			}

			// Add ignore flag for non-ignored checks
			const checkWithIgnoreFlag = { ...check, ignore: false };

			switch ( check.status ) {
				case 'error':
					categories.badChecks.push( checkWithIgnoreFlag );
					break;
				case 'warning':
					categories.fairChecks.push( checkWithIgnoreFlag );
					break;
				case 'success':
					categories.passedChecks.push( checkWithIgnoreFlag );
					break;
				case 'suggestion':
					categories.suggestionChecks.push( checkWithIgnoreFlag );
					break;
				default:
					break;
			}
		} );

		// Add hasBadOrFairChecks flag
		const hasBadOrFairChecks =
			categories.badChecks.length > 0 ||
			categories.fairChecks.length > 0 ||
			categories.suggestionChecks.length > 0;

		setChecks( { ...categories, hasBadOrFairChecks } );
	}, [ variables, postDynamicData, globalDefaults, ignoredList ] );

	// initial check.
	useLayoutEffect( () => {
		if ( ! settingsLoaded ) {
			return;
		}
		const snapshot = getEditorData();

		// // Check if any dependencies have actually changed
		const hasDataChanged =
			! isEqual( lastMeta.current, metaData ) ||
			! isEqual( lastSnapshot.current, snapshot ) ||
			lastKeyword.current !== focusKeyword ||
			! isEqual( lastIgnoredList.current, ignoredList );

		if ( hasDataChanged ) {
			runKeywordChecks( snapshot, metaData, focusKeyword );
			lastSnapshot.current = snapshot;
			lastMeta.current = metaData;
			lastKeyword.current = focusKeyword;
			lastIgnoredList.current = ignoredList;
		}
	}, [
		settingsLoaded,
		focusKeyword,
		metaData,
		variables,
		globalDefaults,
		postDynamicData,
		ignoredList,
	] );

	// subscribe to content changes.
	useLayoutEffect( () => {
		if ( ! settingsLoaded ) {
			return;
		}

		const updateChecks = debounce( () => {
			const snapshot = getEditorData();
			if (
				! isEqual( lastSnapshot.current, snapshot ) ||
				! isEqual( lastMeta.current, metaData ) ||
				lastKeyword.current !== focusKeyword ||
				! isEqual( lastIgnoredList.current, ignoredList )
			) {
				lastSnapshot.current = snapshot;
				lastMeta.current = metaData;
				lastKeyword.current = focusKeyword;
				lastIgnoredList.current = ignoredList;
				runKeywordChecks( snapshot, metaData, focusKeyword );
			}
		}, 300 );

		const unsubscribe = subscribe( updateChecks );
		return () => {
			unsubscribe();
			updateChecks.cancel();
		};
	}, [
		settingsLoaded,
		metaData,
		focusKeyword,
		variables,
		globalDefaults,
		postDynamicData,
		ignoredList,
		runKeywordChecks,
	] );

	return checks;
};
