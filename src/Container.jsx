export function Container({
    name, 
    imageName
}) 
{
    return (
        <div>
            <div>{name}</div>
            <div>{imageName}</div>
        </div>
    )
}