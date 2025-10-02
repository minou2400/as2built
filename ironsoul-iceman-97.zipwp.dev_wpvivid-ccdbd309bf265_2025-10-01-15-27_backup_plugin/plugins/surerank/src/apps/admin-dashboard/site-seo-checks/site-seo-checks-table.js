import { Container, Badge, Button, Pagination, Table } from '@bsf/force-ui';
import { __, sprintf } from '@wordpress/i18n';
import { ArrowRight, ArrowUpRight, Search, X } from 'lucide-react';
import { ConfirmationDialog } from '@GlobalComponents/confirmation-dialog';
import SiteSeoChecksFixButton from './site-seo-checks-fix-button';
import { useSuspenseSiteSeoAnalysis } from './site-seo-checks-main';
import {
	getSeverityColor,
	getSeverityLabel,
} from '@GlobalComponents/seo-checks';
import usePagination from '@/global/hooks/use-pagination';
import ContentPerformanceEmptyState from '../content-performance-empty-state';
import { useState, useCallback, useMemo } from '@wordpress/element';
import { Link } from '@tanstack/react-router';
import apiFetch from '@wordpress/api-fetch';

const ITEMS_PER_PAGE = 20;
const SUMMARY_ITEMS_COUNT = 5;

// Action button component
const SiteSeoChecksActionButtons = ( {
	onViewItem,
	item,
	onIgnore,
	showFixButton,
} ) => {
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );

	const ignoreCheck = useCallback(
		async ( id ) => {
			const response = await apiFetch( {
				path: `/surerank/v1/checks/ignore-site-check`,
				method: 'POST',
				data: { id },
			} );
			if ( response.status === 'success' ) {
				onIgnore( id, true );
				setIsDialogOpen( false );
			}
		},
		[ onIgnore ]
	);

	const restoreCheck = useCallback(
		async ( id ) => {
			const response = await apiFetch( {
				path: `/surerank/v1/checks/ignore-site-check`,
				method: 'DELETE',
				data: { id },
			} );
			if ( response.status === 'success' ) {
				onIgnore( id, false );
			}
		},
		[ onIgnore ]
	);

	const handleSelectOnly = () => {
		onViewItem( false );
	};

	// 🟢 If item is ignored, only show Restore
	if ( item.ignore ) {
		return (
			<Container justify="end">
				<Button
					size="xs"
					variant="outline"
					iconPosition="right"
					onClick={ () => restoreCheck( item.id ) }
				>
					{ __( 'Restore', 'surerank' ) }
				</Button>
			</Container>
		);
	}

	return (
		<Container justify="end">
			{ showFixButton && (
				<SiteSeoChecksFixButton
					selectedItem={ item }
					size="xs"
					runBeforeOnClick={ handleSelectOnly }
				/>
			) }
			{ item.status !== 'success' && item.status !== 'suggestion' && (
				<>
					<Button
						size="xs"
						variant="outline"
						icon={ <X /> }
						iconPosition="right"
						onClick={ () => setIsDialogOpen( true ) }
					>
						{ __( 'Ignore', 'surerank' ) }
					</Button>
					<ConfirmationDialog
						open={ isDialogOpen }
						setOpen={ setIsDialogOpen }
						title={ __( 'Ignore Site Check', 'surerank' ) }
						description={ __(
							"We'll stop flagging this check in future scans. If it's not relevant, feel free to ignore it, you can always bring it back later if needed.",
							'surerank'
						) }
						confirmLabel={ __( 'Ignore', 'surerank' ) }
						cancelLabel={ __( 'Cancel', 'surerank' ) }
						onConfirm={ () => ignoreCheck( item.id ) }
						confirmVariant="primary"
						confirmDestructive={ true }
					/>
				</>
			) }
			<Button
				size="xs"
				variant="outline"
				icon={ <ArrowRight /> }
				iconPosition="right"
				onClick={ onViewItem }
			>
				{ __( 'View', 'surerank' ) }
			</Button>
		</Container>
	);
};

// Table row component
const SiteSeoChecksTableRow = ( { item, onIgnore } ) => {
	const [ , dispatch ] = useSuspenseSiteSeoAnalysis();

	const handleViewItem = useCallback(
		( openModal = true ) => {
			dispatch( {
				open: typeof openModal === 'boolean' ? openModal : true,
				selectedItem: item,
				currentScreen: 'overview',
			} );
		},
		[ item, dispatch ]
	);

	return (
		<Table.Row>
			<Table.Cell>
				<Container gap="xl" align="center">
					<Container.Item>
						<Badge
							label={ getSeverityLabel(
								item?.status,
								item?.ignore
							) }
							variant={ getSeverityColor( item?.status ) }
							disabled={ item?.ignore }
						/>
					</Container.Item>
					<Container.Item>{ item?.message }</Container.Item>
				</Container>
			</Table.Cell>
			<Table.Cell>
				<SiteSeoChecksActionButtons
					onViewItem={ handleViewItem }
					showFixButton={ item?.status !== 'success' }
					item={ item }
					onIgnore={ onIgnore }
				/>
			</Table.Cell>
		</Table.Row>
	);
};

// Table component
const SiteSeoChecksTable = ( { limit, showViewAll = false } ) => {
	const [ { searchKeyword, report = [] }, dispatch ] =
		useSuspenseSiteSeoAnalysis();
	const [ currentPage, setCurrentPage ] = useState( 1 );

	const itemsPerPage = limit
		? Math.max( limit, SUMMARY_ITEMS_COUNT )
		: ITEMS_PER_PAGE;
	const showPagination = ! limit;

	// Handle ignoring a check locally
	const handleIgnoreCheck = useCallback(
		( id, isIgnored ) => {
			const newReport = { ...report };
			if ( newReport[ id ] ) {
				newReport[ id ] = {
					...newReport[ id ],
					ignore: isIgnored,
				};
			}
			dispatch( { report: newReport } );
		},
		[ report, dispatch ]
	);

	const filteredContent = useMemo( () => {
		const statusPriority = {
			error: 0,
			warning: 1,
			suggestion: 2,
			success: 3,
		};

		return Object.entries( report )
			.filter( ( [ , item ] ) => {
				if ( typeof item !== 'object' ) {
					return false;
				}
				return item.message
					.toLowerCase()
					.includes( searchKeyword.toLowerCase() );
			} )
			.map( ( [ key, item ] ) => ( { ...item, id: key } ) )
			.sort( ( a, b ) => {
				const aPriority = a.ignore
					? 4
					: statusPriority[ a.status ] ?? 4;
				const bPriority = b.ignore
					? 4
					: statusPriority[ b.status ] ?? 4;
				return aPriority - bPriority;
			} );
	}, [ searchKeyword, report ] );

	const {
		pages,
		currentPage: validCurrentPage,
		totalPages,
		isPreviousDisabled,
		isNextDisabled,
		handlePageChange,
		goToPreviousPage,
		goToNextPage,
	} = usePagination(
		{
			totalPages: Math.ceil( filteredContent.length / itemsPerPage ),
			currentPage,
			showEllipsis: true,
			maxVisiblePages: 5,
			onPageChange: ( page ) => {
				setCurrentPage( page );
			},
		},
		[ searchKeyword ]
	);

	const filteredPaginatedContent = useMemo( () => {
		if ( limit ) {
			return filteredContent.slice( 0, limit );
		}
		return filteredContent.slice(
			( currentPage - 1 ) * itemsPerPage,
			currentPage * itemsPerPage
		);
	}, [ filteredContent, currentPage, itemsPerPage, limit ] );

	if ( filteredContent.length === 0 ) {
		return (
			<ContentPerformanceEmptyState
				title={ __( 'No Results Found', 'surerank' ) }
				description={ __(
					"Your search didn't match any results. Please try a different keyword or refine your search criteria.",
					'surerank'
				) }
				icon={ <Search /> }
			/>
		);
	}

	return (
		<Table>
			<Table.Head>
				<Table.HeadCell>{ __( 'Issue', 'surerank' ) }</Table.HeadCell>
				<Table.HeadCell className="w-72 text-center">
					{ __( 'Action', 'surerank' ) }
				</Table.HeadCell>
			</Table.Head>
			<Table.Body>
				{ filteredPaginatedContent.map( ( item, index ) => (
					<SiteSeoChecksTableRow
						key={ `row-${ index }-${ currentPage }` }
						item={ item }
						onIgnore={ handleIgnoreCheck }
					/>
				) ) }
			</Table.Body>
			{ showViewAll && (
				<Table.Footer>
					<Button
						tag={ Link }
						size="md"
						variant="link"
						icon={ <ArrowUpRight /> }
						iconPosition="right"
						className="w-fit mx-auto no-underline hover:no-underline"
						to="/site-seo-analysis"
					>
						{ __( 'View Full Report', 'surerank' ) }
					</Button>
				</Table.Footer>
			) }
			{ showPagination && filteredContent?.length > itemsPerPage && (
				<Table.Footer>
					<SiteSeoChecksPagination
						pages={ pages }
						validCurrentPage={ validCurrentPage }
						totalPages={ totalPages }
						isPreviousDisabled={ isPreviousDisabled }
						isNextDisabled={ isNextDisabled }
						handlePageChange={ handlePageChange }
						goToPreviousPage={ goToPreviousPage }
						goToNextPage={ goToNextPage }
					/>
				</Table.Footer>
			) }
		</Table>
	);
};

// Pagination component
const SiteSeoChecksPagination = ( {
	pages,
	validCurrentPage,
	totalPages,
	isPreviousDisabled,
	isNextDisabled,
	handlePageChange,
	goToPreviousPage,
	goToNextPage,
} ) => {
	return (
		<Container align="center" justify="between">
			<div aria-label="Pagination status" aria-current="page">
				{ sprintf(
					// translators: %1$s is the current page number, %2$s is the total number of pages
					__( 'Page %1$s out of %2$s', 'surerank' ),
					validCurrentPage,
					totalPages
				) }
			</div>
			<div>
				<Pagination size="sm">
					<Pagination.Content>
						<Pagination.Previous
							className="disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={ isPreviousDisabled }
							tag="button"
							onClick={ goToPreviousPage }
							aria-label={ __( 'Previous page', 'surerank' ) }
						/>
						{ pages.map( ( page, index ) => {
							if ( page === '...' ) {
								return (
									<Pagination.Ellipsis
										key={ `ellipsis-${ index }` }
									/>
								);
							}
							return (
								<Pagination.Item
									key={ page }
									isActive={ page === validCurrentPage }
									onClick={ () => handlePageChange( page ) }
									aria-label={ sprintf(
										// translators: %s is the page number
										__( 'Page %s', 'surerank' ),
										page
									) }
									tag="button"
								>
									{ page }
								</Pagination.Item>
							);
						} ) }
						<Pagination.Next
							className="disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={ isNextDisabled }
							tag="button"
							onClick={ goToNextPage }
							aria-label={ __( 'Next page', 'surerank' ) }
						/>
					</Pagination.Content>
				</Pagination>
			</div>
		</Container>
	);
};

export default SiteSeoChecksTable;
