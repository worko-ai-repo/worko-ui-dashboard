import { Headphones } from 'lucide-react'
import { useState } from 'react'
import Modal from '../Modal'
import SupportTable from './SupportTable'
import SupportForm from './SupportForm'


const Support = () => {
    const [isSupportFormOpen, setIsSupportFormOpen] = useState(false)

    return (
        <div className='space-y-4'>
            <div className='flex justify-end'>
                <button
                    onClick={() => setIsSupportFormOpen(true)}
                    className='flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-xl text-white text-sm'
                >
                    <Headphones size={16} />
                    <span>Help</span>
                </button>
            </div>
            <SupportTable />
            <Modal
                isOpen={isSupportFormOpen}
                onClose={() => setIsSupportFormOpen(false)}
                className="w-[90vw] sm:w-[455px] sm:min-h-[404px] max-sm:h-[90dvh]"
            >
                <SupportForm />
            </Modal>
        </div>
    )
}

export default Support
