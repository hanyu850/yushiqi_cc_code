/**
 * Transport layer abstraction for CLI I/O.
 *
 * The Transport interface defines how the CLI communicates with the
 * outside world. Different transports are used for different modes:
 * - ConsoleTransport: Standard terminal I/O (stdin/stdout)
 * - RemoteTransport: Bridge-based remote control
 * - NDJSONTransport: Newline-delimited JSON for SDK/pipe mode
 */
export interface Transport {
  /** Write output to the transport */
  write(data: string): void
  /** Write output with a newline */
  writeln(data: string): void
  /** Read input from the transport */
  read(): Promise<string>
  /** Check if the transport is interactive (can show UI) */
  isInteractive(): boolean
  /** Clean up the transport */
  close(): void
}
