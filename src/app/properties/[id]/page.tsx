import { PublicPropertyDetailWorkspace } from './_components/PublicPropertyDetailWorkspace'

interface Props {
    params: Promise<{ id: string }>
}

export default async function PropertyPage({ params }: Props) {
    const { id } = await params

    return <PublicPropertyDetailWorkspace id={id} />
}
