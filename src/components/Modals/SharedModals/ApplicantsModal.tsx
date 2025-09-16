import { useNavigate } from 'react-router-dom';
import MessageModal from '../MessageModal'

const ApplicantsModal = () => {
  const nav = useNavigate();
  return (
    <div>
      <MessageModal
        type="error"
        heading={{ message: "Something Went Wrong", type: "error" }}
        message="It seems like you have not selected any job to view applicants. Please select a job to proceed by clicking on the 'Go To Jobs Page' button below."
        buttons={[
          {
            label: "Go To Jobs Page",
            action: () => {
                nav("/corporate/jobs");
            },
          },
        ]}
        showCloseButton={false}
        onClose={() => {
          // console.log("Modal closed");
        }}
      />
    </div>
  );
}

export default ApplicantsModal