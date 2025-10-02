import { useMemo, memo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Loader, Text } from '@bsf/force-ui';
import { motion } from 'framer-motion';
import { CheckCard } from '@GlobalComponents/check-card';

const PageChecks = ( {
	pageSeoChecks = {},
	onIgnore,
	onRestore,
	type = 'page',
} ) => {
	const {
		badChecks = [],
		fairChecks = [],
		passedChecks = [],
		ignoredChecks = [],
		suggestionChecks = [],
		isCheckingLinks = false,
		linkCheckProgress = { current: 0, total: 0 },
	} = pageSeoChecks;

	const hasBadOrFairChecks = useMemo(
		() =>
			badChecks.length > 0 ||
			fairChecks.length > 0 ||
			suggestionChecks.length > 0,
		[ badChecks.length, fairChecks.length, suggestionChecks.length ]
	);

	const handleIgnoreCheck = ( checkId ) => () => {
		if ( ! checkId ) {
			return;
		}
		onIgnore( checkId );
	};

	return (
		<motion.div
			className="space-y-3 p-1"
			initial={ { opacity: 0 } }
			animate={ { opacity: 1 } }
			exit={ { opacity: 0 } }
			transition={ { duration: 0.3 } }
		>
			{ /* Critical and Warning Checks Container */ }
			{ hasBadOrFairChecks && (
				<div className="space-y-3">
					{ /* Broken links check progress will render here - only for page checks */ }
					{ type === 'page' && isCheckingLinks && (
						<div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border-0.5 border-solid border-border-subtle">
							<Loader size="sm" />
							<Text size={ 14 } weight={ 500 } color="tertiary">
								{ sprintf(
									/* translators: %1$d: number of links */
									__(
										'%1$d out of %2$d checks are done.',
										'surerank'
									),
									linkCheckProgress.current,
									linkCheckProgress.total
								) }
							</Text>
						</div>
					) }
					{ badChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check?.id }
							variant="red"
							label={ __( 'Critical', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ handleIgnoreCheck( check.id ) }
							showIgnoreButton={ true }
						/>
					) ) }
					{ fairChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check.id }
							variant="yellow"
							label={ __( 'Warning', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ handleIgnoreCheck( check.id ) }
							showIgnoreButton={ true }
						/>
					) ) }
					{ suggestionChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							id={ check.id }
							variant="blue"
							label={ __( 'Suggestion', 'surerank' ) }
							title={ check.title }
							data={ check?.data }
							showImages={ check?.showImages }
							onIgnore={ handleIgnoreCheck( check.id ) }
						/>
					) ) }
				</div>
			) }
			{ /* Ignored Checks Container */ }
			{ ignoredChecks.length > 0 && (
				<div className="space-y-3">
					{ ignoredChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							variant="neutral"
							label={ __( 'Ignore', 'surerank' ) }
							title={ check.title }
							showFixButton={ false }
							showRestoreButton={ true }
							onRestore={ () => onRestore( check.id ) }
						/>
					) ) }
				</div>
			) }

			{ passedChecks.length > 0 && (
				<div className="space-y-3">
					{ passedChecks.map( ( check ) => (
						<CheckCard
							key={ check.id }
							variant="green"
							label={ __( 'Passed', 'surerank' ) }
							title={ check.title }
							showFixButton={ false }
							onIgnore={ () => onIgnore( check.id ) }
						/>
					) ) }
				</div>
			) }
		</motion.div>
	);
};

export default memo( PageChecks );
