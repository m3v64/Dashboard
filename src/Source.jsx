export default function Source({
    name,
    children
}) 
{
    return (
        <div>
            <div>{name}</div>
            {children}
        </div>
    )
}