'use client'

import { Sidebar, Title, TopBar } from '@/components/index'
import RandRSidebar from '@/components/Sidebars/RandRSidebar'
import { Button } from '@/components/ui/button'
import { PER_PAGE } from '@/constants'
import { useSupabase } from '@/context/SupabaseProvider'
import { updateList } from '@/GlobalRedux/Features/listSlice'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { AddRankingModal } from './AddRankingModal'
import { Filter } from './Filter'
import { List } from './List'

const Page: React.FC = () => {
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)

  const [modalRankingOpen, setModalRankingOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const { supabase } = useSupabase()

  // Redux staff
  const dispatch = useDispatch()

  // Fetch data on page load
  useEffect(() => {
    dispatch(updateList([])) // Reset the redux first

    const fetchData = async () => {
      const { data, count, error } = await supabase
        .from('rr_rankings')
        .select()
        .ilike('title', `%${filter}%`)
        .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
        .order('id', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        // Update the list of suppliers in Redux store
        dispatch(updateList(data))
        setTotalCount(count || 0)
      }
    }

    void fetchData()
  }, [page, filter, dispatch]) // Add `dispatch` to dependency array

  return (
    <>
      <Sidebar>
        <RandRSidebar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="Pasidungog Ranking" />
            <Button
              onClick={() => setModalRankingOpen(true)}
              className="ml-auto"
            >
              Create Ranking
            </Button>
          </div>

          {/* Filters */}
          <div className="app__filters">
            <Filter filter={filter} setFilter={setFilter} />
          </div>

          <div className="mt-4 py-2 px-4 text-xs border-t border-gray-200 text-gray-500">
            Showing {Math.min((page - 1) * PER_PAGE + 1, totalCount)} to{' '}
            {Math.min(page * PER_PAGE, totalCount)} of {totalCount} results
          </div>

          {/* Pass Redux data to List Table */}
          <List />

          {/* Pagination */}
          {totalCount > PER_PAGE && (
            <div className="app__pagination">
              <Button
                size="xs"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <p>Page {page}</p>
              <Button
                size="xs"
                onClick={() => setPage(page + 1)}
                disabled={page * PER_PAGE >= totalCount}
              >
                Next
              </Button>
            </div>
          )}

          <AddRankingModal
            isOpen={modalRankingOpen}
            onClose={() => setModalRankingOpen(false)}
          />
        </div>
      </div>
    </>
  )
}
export default Page
