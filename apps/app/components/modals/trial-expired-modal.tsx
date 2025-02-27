import { Button } from "@repo/design-system/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface TrialExpiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrialExpiredModal({
  open,
  onOpenChange,
}: TrialExpiredModalProps) {
  const { login } = usePrivy();

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={() => onOpenChange(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className="trial-expired-content mx-auto w-[calc(100%-2rem)] bg-[#161616] border border-[#232323] rounded-xl p-8 max-w-2xl shadow-lg"
              >
                <Dialog.Title className="text-xl font-semibold text-white">
                  Your trial has expired
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-400 mt-1">
                  In order to continue streaming, please sign up or sign in.
                </Dialog.Description>

                <div className="mt-4 flex justify-center">
                  <img src="/images/free-trial.svg" alt="Trial expired illustration" />
                </div>
                <div className="flex gap-4 mt-8">
                  <Button
                    onClick={() => window.open("https://discord.gg/livepeer", "_blank")}
                    size="lg"
                    className="rounded-full h-12 flex-1 bg-black text-white hover:bg-black/90"
                  >
                    Join the Community
                  </Button>
                  <Button
                    onClick={login}
                    size="lg"
                    className="rounded-full h-12 flex-1"
                  >
                    Sign Up
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
