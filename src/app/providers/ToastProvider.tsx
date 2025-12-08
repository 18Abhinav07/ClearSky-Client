
import useToastStore from '../store/toastStore';
import { Toast } from '../../components/ui/toast';

export function ToastProvider() {
  const { isVisible, message, type, hideToast } = useToastStore();

  if (!isVisible) {
    return null;
  }

  return <Toast message={message} type={type} onClose={hideToast} />;
}
