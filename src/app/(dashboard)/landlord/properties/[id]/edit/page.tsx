import { EditPropertyWorkspace } from './_components/EditPropertyWorkspace'

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditPropertyPage({ params }: Props) {
    const { id } = await params

    return <EditPropertyWorkspace id={id} />
}
