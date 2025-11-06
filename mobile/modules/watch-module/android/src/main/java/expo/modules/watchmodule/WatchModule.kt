package expo.modules.watchmodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.android.gms.wearable.MessageClient
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.exception.CodedException  // Import for proper exception handling
import android.util.Log  // For debugging logs

class WatchModule : Module() {
  private var messageListener: MessageClient.OnMessageReceivedListener? = null

  override fun definition() = ModuleDefinition {
    Name("WatchModule")

    Events("onChange")

    Function("startListening") {
      if (messageListener != null) {
        return@Function "Already listening"
      }

      messageListener = MessageClient.OnMessageReceivedListener { messageEvent: MessageEvent ->
        // Optional: Filter by path if needed, e.g., if (messageEvent.path == "/your_message_path")
        val message = String(messageEvent.data ?: byteArrayOf())
        sendEvent("onChange", mapOf("value" to message))
      }

      val context = appContext.reactContext?.applicationContext
        ?: throw CodedException("Application context is null")

      val messageClient = Wearable.getMessageClient(context)
      messageClient.addListener(messageListener!!)
        .addOnSuccessListener { Log.d("WatchModule", "Listener added successfully") }
        .addOnFailureListener { exception ->
          Log.e("WatchModule", "Failed to add listener: ${exception.message}")
          throw CodedException(exception.message ?: "Unknown error")
        }

      "Listening started"
    }

    Function("disableListening") {
      messageListener?.let {
        val context = appContext.reactContext?.applicationContext
          ?: throw CodedException("Application context is null")

        val messageClient = Wearable.getMessageClient(context)
        messageClient.removeListener(it)
          .addOnSuccessListener { Log.d("WatchModule", "Listener removed successfully") }
          .addOnFailureListener { exception ->
            Log.e("WatchModule", "Failed to remove listener: ${exception.message}")
            throw CodedException(exception.message ?: "Unknown error")
          }
        messageListener = null
        "Listening stopped"
      } ?: "Not listening"
    }
  }
}