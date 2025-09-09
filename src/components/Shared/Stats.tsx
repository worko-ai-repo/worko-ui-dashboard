const stats = [
    { label: 'Total Applicants', value: 106 },
    { label: 'Rejected', value: 90 },
    { label: 'Reviewed', value: 20 },
    { label: 'New Applicants', value: 10 },
    { label: 'Hired', value: 90 },
];

const HeaderDetails = () => {
    return (
        <div className="flex flex-wrap gap-4 mt-4 mb-6">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px] max-w-[150px] max-h-[150px] "
                >
                    <p className="text-sm text-[#64748B] text-nowrap">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-gray-900">-</p>
                </div>
            ))}
        </div>
    )
}

export default HeaderDetails
