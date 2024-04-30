/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react-native/no-inline-styles */
import { SelectList } from 'react-native-dropdown-select-list'

interface DropdownInterface {
    setSelected: (val) => void
    placeholder: string
    onSelect: () => void
    data: { key: string; value: string }[]
}

export default function Dropdown(props: DropdownInterface) {
    return (
        <SelectList
            setSelected={(val) => props.setSelected(val)}
            data={props.data}
            save="key"
            onSelect={props.onSelect}
            inputStyles={{ color: 'black' }}
            dropdownTextStyles={{ color: 'black' }}
            placeholder={props.placeholder}
        />
    )
}
