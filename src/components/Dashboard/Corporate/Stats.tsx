const stats = [
    { label: 'Total Applicants', value: 106 },
    { label: 'Rejected', value: 90 },
    { label: 'Reviewed', value: 20 },
    { label: 'New Applicants', value: 10 },
    { label: 'Hired', value: 90 },
];

const HeaderDetails = () => {
    return (
        <>
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
                >
                    <p className="text-sm text-[#64748B] text-nowrap">{stat.label}</p>
                    <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                </div>
            ))}
        </>
    )
}

export default HeaderDetails
