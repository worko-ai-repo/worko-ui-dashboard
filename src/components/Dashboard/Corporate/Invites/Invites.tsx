import { Send } from 'lucide-react'
import InviteTable from './InvitesTable'
import { useEffect, useState } from 'react'
import Modal from '../Modal'
import InviteForm from './SendInviteForm'
import httpServiceObj from '@Services/ApiHandler.service'
import { CorporateInviteResponse, CorporateInvite } from '@Interfaces/CorporateDashboard.dto'
import SkeletonLoader from '../SkeletonLoader'

const Invites = () => {
  const [isSendInviteModalOpen, setIsSendInviteModalOpen] = useState(false);
  const [data, setData] = useState<CorporateInviteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvites = async () => {
    try {
      const params = new URLSearchParams({
        pageSize: '25',
      });

      const url = `https://api.dev.worko.work/corporate-invite/?${params.toString()}`;
      const { response, error } = await httpServiceObj.get(url, true, {}, true);
      setData(response as CorporateInviteResponse);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchInvites();
  }, [])

  if (isLoading) {
    return (
      <SkeletonLoader
        showButtons={true}
        buttonCount={1}
        showTableHeader={true}
        showTableRows={true}
        tableColumns={5}
        rowCount={5}
      />
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <button
          onClick={() => setIsSendInviteModalOpen(true)}
          className='flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-white text-sm'
        >
          <Send size={16} />
          <span>Invite Team</span>
        </button>
      </div>
      <InviteTable
        data={data as CorporateInviteResponse}
        fetchInvites={fetchInvites}
      />
      <Modal
        isOpen={isSendInviteModalOpen}
        onClose={() => setIsSendInviteModalOpen(false)}
        className="w-[90vw] sm:w-[455px] sm:h-[500px] h-[90vh]"
      >
        <InviteForm />
      </Modal>
    </div>
  )
}

export default Invites
